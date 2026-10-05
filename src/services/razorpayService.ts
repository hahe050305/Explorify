// src/services/razorpayService.ts
import axios from 'axios';
import { Alert } from 'react-native';
import { ENDPOINTS } from '../config/api';

/**
 * Safely load react-native-razorpay native module.
 * If react-native-razorpay is not installed or the native build hasn't completed yet,
 * it will not crash the app.
 */
let RazorpayCheckout: any = null;
try {
  const rzpModule = require('react-native-razorpay');
  RazorpayCheckout = rzpModule.default || rzpModule;
} catch (e) {
  RazorpayCheckout = null;
}
 
export const isRazorpayNativeAvailable = (): boolean => {
  return RazorpayCheckout !== null && typeof RazorpayCheckout.open === 'function';
};

export interface RazorpayOrderResponse {
  success: boolean;
  keyId: string;
  orderId: string; // Razorpay Order ID (e.g. "order_XXXXXX")
  amount: number;  // In paise (e.g. 29900)
  currency: string;
  appOrderId: string;
}

export interface PaymentSuccessResult {
  paymentId: string;
  orderId: string;
  signature?: string;
  appOrderId: string;
}

/**
 * Step 1: Create an Order on backend server via Razorpay API
 */
export async function createBackendOrder(params: {
  amount: number;
  appOrderId: string;
  userId?: string | number;
  userEmail?: string;
  items?: any[];
  shippingAddress?: string;
}): Promise<RazorpayOrderResponse> {
  const response = await axios.post(ENDPOINTS.CREATE_ORDER, params, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  if (!response.data || !response.data.success) {
    throw new Error(response.data?.error || 'Failed to create order on server');
  }

  return response.data;
}

/**
 * Step 3: Cryptographically verify payment signature on backend server
 */
export async function verifyPaymentSignatureOnBackend(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  appOrderId: string;
}): Promise<boolean> {
  const response = await axios.post(ENDPOINTS.VERIFY_PAYMENT, params, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  return Boolean(response.data && response.data.success);
}

/**
 * Complete End-to-End Razorpay Payment Flow
 */
export async function processRazorpayPayment({
  amount,
  appOrderId,
  user,
  items,
  shippingAddress,
  prefillPhone = '',
  onSuccess,
  onError,
  onCancel,
}: {
  amount: number;
  appOrderId: string;
  user?: { id?: string | number; email?: string; username?: string } | null;
  items?: any[];
  shippingAddress?: string;
  prefillPhone?: string;
  onSuccess: (result: PaymentSuccessResult) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
}) {
  try {
    // ── 1. Create order on Backend ──
    const orderData = await createBackendOrder({
      amount,
      appOrderId,
      userId: user?.id,
      userEmail: user?.email,
      items,
      shippingAddress,
    });

    // ── 2. Check if react-native-razorpay native module is compiled into the app ──
    if (!isRazorpayNativeAvailable()) {
      console.warn('⚠️ [Razorpay] Native module not detected. Make sure to run `npm install react-native-razorpay` and rebuild the app.');
      
      Alert.alert(
        'Razorpay Native Module Setup',
        'react-native-razorpay is not yet installed or compiled in your build.\n\nTo enable native Razorpay:\n1. Run: npm install react-native-razorpay\n2. Rebuild: npm run android\n\nWould you like to simulate a successful payment test for now?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              if (onCancel) onCancel();
            },
          },
          {
            text: 'Simulate Success (Dev)',
            onPress: () => {
              // Simulated test verification for dev testing
              const simulatedPaymentId = `pay_sim_${Date.now().toString().slice(-8)}`;
              onSuccess({
                paymentId: simulatedPaymentId,
                orderId: orderData.orderId,
                appOrderId,
              });
            },
          },
        ]
      );
      return;
    }

    // ── 3. Open Razorpay Checkout Sheet (Standard Checkout) ──
    const checkoutOptions = {
      description: 'Explorify Shopping Order',
      currency: orderData.currency || 'INR',
      key: orderData.keyId,
      amount: orderData.amount, // in paise
      name: 'Explorify',
      order_id: orderData.orderId,
      prefill: {
        email: user?.email || '',
        contact: prefillPhone || '',
        name: user?.username || 'Customer',
      },
      theme: {
        color: '#16A34A', // Explorify primary brand color
      },
    };

    RazorpayCheckout.open(checkoutOptions)
      .then(async (data: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        // ── 4. Verify payment on Backend ──
        try {
          const verified = await verifyPaymentSignatureOnBackend({
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
            appOrderId,
          });

          if (verified) {
            onSuccess({
              paymentId: data.razorpay_payment_id,
              orderId: data.razorpay_order_id,
              signature: data.razorpay_signature,
              appOrderId,
            });
          } else {
            onError(new Error('Payment verification failed on server: signature mismatch'));
          }
        } catch (verifyErr: any) {
          onError(verifyErr);
        }
      })
      .catch((error: any) => {
        // Razorpay checkout failure or user cancellation
        // Error format: { code: number, description: string }
        if (error.code === 0 || error.code === 2 || (error.description && error.description.toLowerCase().includes('cancel'))) {
          if (onCancel) {
            onCancel();
          } else {
            console.log('Payment cancelled by user');
          }
        } else {
          onError(error);
        }
      });
  } catch (error: any) {
    onError(error);
  }
}
