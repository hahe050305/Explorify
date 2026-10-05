// backend/razorpay.js
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
 *
 * @param {Object} params
 * @param {number} params.amountInRupees - Total amount in Rupees (e.g. 199.50)
 * @param {string} params.receipt - Unique internal receipt/order identifier
 * @param {Object} [params.notes] - Custom metadata (e.g. user ID, product IDs)
 * @param {string} [params.currency='INR'] - Default 'INR'
 */
async function createOrder({ amountInRupees, receipt, notes = {}, currency = 'INR' }) {
  if (!instance) {
    throw new Error('Razorpay SDK is not initialized. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env');
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
 *
 * How it works:
 * 1. Razorpay checkout client receives:
 *    - razorpay_payment_id
 *    - razorpay_order_id
 *    - razorpay_signature
 * 2. Signature algorithm:
 *    HMAC-SHA256 of string `order_id + '|' + payment_id` signed using RAZORPAY_KEY_SECRET.
 * 3. We compute the expected digest and compare it against razorpay_signature.
 *
 * @param {Object} params
 * @param {string} params.order_id - Razorpay Order ID (starts with "order_")
 * @param {string} params.payment_id - Razorpay Payment ID (starts with "pay_")
 * @param {string} params.signature - Razorpay hex signature sent by mobile client
 * @returns {boolean} true if authentic, false if tampered
 */
function verifyPaymentSignature({ order_id, payment_id, signature }) {
  if (!order_id || !payment_id || !signature) {
    return false;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error('❌ [Razorpay] Cannot verify signature: RAZORPAY_KEY_SECRET is not set in backend/.env');
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
 * @param {string} rawBody - Raw webhook request body as string
 * @param {string} signature - Value of 'x-razorpay-signature' header
 * @returns {boolean}
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
