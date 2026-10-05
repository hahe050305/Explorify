// server/razorpay.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

let instance = null;

try {
  instance = new Razorpay({
    key_id: KEY_ID,
    key_secret: KEY_SECRET,
  });
  console.log(`💳 [Razorpay] Initialized SDK with Key ID: ${KEY_ID.substring(0, 10)}...`);
} catch (err) {
  console.warn('⚠️ [Razorpay] Could not initialize SDK:', err.message);
}

/**
 * Creates an Order in Razorpay.
 *
 * NOTE ON RAZORPAY AMOUNTS:
 * Razorpay expects amount in the smallest currency sub-unit:
 * For INR, amount must be in paise (1 INR = 100 paise).
 * e.g., ₹250.00 -> 25000 paise.
 */
async function createOrder({ amountInRupees, receipt, notes = {}, currency = 'INR' }) {
  if (!instance) {
    throw new Error('Razorpay SDK is not initialized. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env');
  }

  // Convert to paise (integer)
  const amountInPaise = Math.round(Number(amountInRupees) * 100);

  if (isNaN(amountInPaise) || amountInPaise <= 0) {
    throw new Error(`Invalid amount: ${amountInRupees}. Amount must be greater than 0.`);
  }

  const options = {
    amount: amountInPaise,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    payment_capture: 1, // Automatically capture payment upon authorization
    notes: {
      ...notes,
      createdAt: new Date().toISOString(),
    },
  };

  const razorpayOrder = await instance.orders.create(options);
  return razorpayOrder;
}

/**
 * Cryptographically verifies Razorpay payment signature.
 */
function verifyPaymentSignature({ order_id, payment_id, signature }) {
  if (!order_id || !payment_id || !signature) {
    return false;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error('❌ [Razorpay] Cannot verify signature: RAZORPAY_KEY_SECRET is not set in server/.env');
    return false;
  }

  const payload = `${order_id}|${payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

/**
 * Verifies Razorpay Webhook signature
 */
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}

module.exports = {
  getRazorpayInstance: () => instance,
  getKeyId: () => KEY_ID,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
