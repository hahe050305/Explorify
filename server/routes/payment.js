// server/routes/payment.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getKeyId,
} = require('../razorpay');

/**
 * GET /api/payment/config
 * Returns the public Razorpay Key ID for the mobile client.
 * (Never expose RAZORPAY_KEY_SECRET!)
 */
router.get('/config', (req, res) => {
  return res.json({
    keyId: getKeyId(),
    currency: 'INR',
  });
});

/**
 * POST /api/payment/create-order
 *
 * Step 1 in Razorpay Flow:
 * Mobile app requests backend to create an official order in Razorpay.
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, appOrderId, userId, userEmail, items, shippingAddress } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const receiptId = appOrderId || `rcpt_${Date.now()}`;

    console.log(`💳 [Razorpay] Creating order for Amount: ₹${amount}, Receipt: ${receiptId}`);

    // Call Razorpay API to create order
    const razorpayOrder = await createOrder({
      amountInRupees: amount,
      receipt: receiptId,
      notes: {
        appOrderId: receiptId,
        userEmail: userEmail || '',
        userId: String(userId || ''),
      },
    });

    console.log(`✅ [Razorpay] Order created on Razorpay: ${razorpayOrder.id} for ₹${amount}`);

    // Insert pending order record into MySQL orders table
    try {
      await pool.query(
        `INSERT INTO orders 
          (order_id, razorpay_order_id, user_id, user_email, amount, currency, status, items, shipping_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
          razorpay_order_id = VALUES(razorpay_order_id),
          amount = VALUES(amount),
          status = 'created'`,
        [
          receiptId,
          razorpayOrder.id,
          userId || null,
          userEmail || null,
          amount,
          razorpayOrder.currency || 'INR',
          'created',
          items ? JSON.stringify(items) : null,
          shippingAddress || null,
        ]
      );
      console.log(`📝 [DB] Order ${receiptId} saved to database with status 'created'`);
    } catch (dbErr) {
      console.warn('⚠️ [DB] Warning saving order to database (proceeding with order response):', dbErr.message);
    }

    // Return Razorpay order details & Key ID back to mobile app
    return res.status(200).json({
      success: true,
      keyId: getKeyId(),
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      appOrderId: receiptId,
    });
  } catch (error) {
    console.error('❌ [Razorpay] Create order failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Razorpay order',
    });
  }
});

/**
 * POST /api/payment/verify-payment
 *
 * Step 3 in Razorpay Flow:
 * Mobile app submits the Razorpay payment response for cryptographic signature verification.
 */
router.post('/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appOrderId,
    } = req.body;

    console.log(`🔐 [Razorpay] Verifying payment signature for Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}`);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      });
    }

    // Cryptographic HMAC-SHA256 signature verification
    const isValid = verifyPaymentSignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      console.error(`❌ [Razorpay] Invalid payment signature for Order: ${razorpay_order_id}!`);
      
      try {
        await pool.query(
          `UPDATE orders SET status = 'failed', razorpay_payment_id = ?, razorpay_signature = ? 
           WHERE razorpay_order_id = ? OR order_id = ?`,
          [razorpay_payment_id, razorpay_signature, razorpay_order_id, appOrderId || '']
        );
      } catch (e) {
        // continue
      }

      return res.status(400).json({
        success: false,
        error: 'Payment verification failed: Signature mismatch',
      });
    }

    console.log(`✅ [Razorpay] Payment verified successfully! Payment ID: ${razorpay_payment_id}`);

    // Update DB order status to paid
    try {
      await pool.query(
        `UPDATE orders 
         SET status = 'paid', 
             razorpay_payment_id = ?, 
             razorpay_signature = ?
         WHERE razorpay_order_id = ? OR order_id = ?`,
        [razorpay_payment_id, razorpay_signature, razorpay_order_id, appOrderId || '']
      );
      console.log(`📝 [DB] Order status updated to 'paid' in database`);
    } catch (dbErr) {
      console.warn('⚠️ [DB] Warning updating order in database:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and captured successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      appOrderId: appOrderId,
    });
  } catch (error) {
    console.error('❌ [Razorpay] Payment verification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Payment verification failed',
    });
  }
});

/**
 * POST /api/payment/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const isAuthentic = verifyWebhookSignature(rawBody, signature);
    if (!isAuthentic) {
      console.warn('⚠️ [Razorpay Webhook] Invalid webhook signature received');
      return res.status(400).json({ status: 'invalid_signature' });
    }

    const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
    console.log(`🔔 [Razorpay Webhook] Received Event: ${event.event}`);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      await pool.query(
        `UPDATE orders SET status = 'paid', razorpay_payment_id = ? WHERE razorpay_order_id = ?`,
        [razorpayPaymentId, razorpayOrderId]
      );
      console.log(`✅ [Webhook] Order ${razorpayOrderId} marked as paid via webhook.`);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('❌ [Razorpay Webhook] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
