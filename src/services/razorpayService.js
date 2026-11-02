/**
 * Razorpay Payment Gateway Service
 * Handles server-side order generation and timing-safe cryptographic signature verification.
 */
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Lazy-initialized Razorpay instance
let razorpayInstance = null;

function getRazorpayInstance() {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
    razorpayInstance = new Razorpay({ key_id, key_secret });
  }
  return razorpayInstance;
}

/**
 * Checks whether system is running in demo/test fallback mode.
 * Demo mode accepts a mock signature, so it can never be active in production.
 */
function isDemoMode() {
  if (process.env.NODE_ENV === 'production') return false;
  const isDemo = process.env.DEMO_PAYMENT_ENABLED === 'true';
  const hasPlaceholderKey = !process.env.RAZORPAY_KEY_ID || 
                            process.env.RAZORPAY_KEY_ID.includes('YourTestKeyId') ||
                            process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder';
  return isDemo || hasPlaceholderKey;
}

/**
 * Creates a Razorpay Order
 * @param {Object} params - { amountInPaise, currency, receipt, notes }
 * @returns {Promise<Object>} Razorpay order details
 */
async function createRazorpayOrder({ amountInPaise, currency = 'INR', receipt, notes = {} }) {
  if (!amountInPaise || amountInPaise <= 0) {
    throw new Error('Order amount in paise must be a positive integer');
  }

  const roundedPaise = Math.round(amountInPaise);

  if (isDemoMode()) {
    // Deterministic mock order for automated tests and demo environments
    const mockId = `order_demo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    return {
      id: mockId,
      entity: 'order',
      amount: roundedPaise,
      amount_paid: 0,
      amount_due: roundedPaise,
      currency: currency || 'INR',
      receipt: String(receipt || '').slice(0, 40),
      status: 'created',
      attempts: 0,
      notes,
      created_at: Math.floor(Date.now() / 1000),
      isDemo: true
    };
  }

  const rzp = getRazorpayInstance();
  const options = {
    amount: roundedPaise,
    currency: currency || 'INR',
    receipt: String(receipt || '').slice(0, 40),
    notes
  };

  return await rzp.orders.create(options);
}

/**
 * Cryptographically verifies Razorpay payment signature using constant-time HMAC-SHA256 comparison.
 * Prevents timing side-channel attacks and guards against RangeError on buffer length mismatches.
 * 
 * @param {Object} params - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns {boolean} True if signature is authentic, false otherwise
 */
function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  // Handle demo bypass signature in demo/test mode only
  if (isDemoMode() && razorpay_signature === 'demo_mock_signature') {
    return true;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const expectedBuffer = Buffer.from(generatedSignature, 'utf8');
  const receivedBuffer = Buffer.from(razorpay_signature, 'utf8');

  // CRITICAL SECURITY GUARD:
  // crypto.timingSafeEqual throws an unhandled RangeError if buffer lengths differ.
  // We must verify byte lengths first to prevent process crash or HTTP 500 error.
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  isDemoMode
};
