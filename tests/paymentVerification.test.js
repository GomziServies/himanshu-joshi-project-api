const crypto = require('crypto');
const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const TransactionReceipt = require('../src/models/TransactionReceipt');

describe('Payment Verification API — Cryptographic HMAC-SHA256 & Idempotency', () => {
  let testOrder;
  const testSecret = 'test_razorpay_secret_67890';

  beforeEach(async () => {
    testOrder = await Order.create({
      orderNumber: 'ORD-20261029-9999',
      customer: {
        name: 'Vedic Devotee',
        email: 'devotee@temple.org',
        phone: '+919876543210',
        sankalpName: 'Vedic Devotee',
        gotra: 'Vashistha'
      },
      items: [{
        productTitle: 'Shivling Sthapana Offering',
        quantity: 1,
        unitPrice: 5100,
        subtotal: 5100
      }],
      totalAmount: 5100,
      currency: 'INR',
      status: 'CREATED',
      paymentStatus: 'UNPAID',
      razorpayOrderId: 'order_test_12345'
    });
  });

  it('verifies valid HMAC-SHA256 signature, transitions order to PAID, creates TransactionReceipt', async () => {
    const razorpay_order_id = 'order_test_12345';
    const razorpay_payment_id = 'pay_test_98765';
    
    // Generate authentic cryptographic signature using testSecret
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const razorpay_signature = crypto
      .createHmac('sha256', testSecret)
      .update(payload)
      .digest('hex');

    const response = await request(app)
      .post('/api/orders/verify-payment')
      .send({
        orderId: testOrder._id.toString(),
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.receiptNumber).toBeDefined();

    // Check order state in DB
    const updatedOrder = await Order.findById(testOrder._id);
    expect(updatedOrder.status).toBe('PAID');
    expect(updatedOrder.paymentStatus).toBe('CAPTURED');
    expect(updatedOrder.razorpayPaymentId).toBe(razorpay_payment_id);

    // Check TransactionReceipt created in DB
    const receipt = await TransactionReceipt.findOne({ orderId: testOrder._id });
    expect(receipt).not.toBeNull();
    expect(receipt.amountPaid).toBe(5100);
    expect(receipt.customerDetails.gotra).toBe('Vashistha');
  });

  it('REJECTS tampered cryptographic signature with HTTP 400 Bad Request', async () => {
    const razorpay_order_id = 'order_test_12345';
    const razorpay_payment_id = 'pay_test_98765';
    
    // Generate genuine signature and corrupt the last character
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const realSignature = crypto
      .createHmac('sha256', testSecret)
      .update(payload)
      .digest('hex');
    const tamperedSignature = realSignature.slice(0, -1) + (realSignature.slice(-1) === 'a' ? 'b' : 'a');

    const response = await request(app)
      .post('/api/orders/verify-payment')
      .send({
        orderId: testOrder._id.toString(),
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature: tamperedSignature
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/invalid.*signature/i);

    const checkOrder = await Order.findById(testOrder._id);
    expect(checkOrder.status).toBe('FAILED');
  });

  it('guards against timingSafeEqual RangeError when signature length differs', async () => {
    const response = await request(app)
      .post('/api/orders/verify-payment')
      .send({
        orderId: testOrder._id.toString(),
        razorpay_order_id: 'order_test_12345',
        razorpay_payment_id: 'pay_test_98765',
        razorpay_signature: 'short_sig_123' // Length 13 instead of 64 hex chars
      });

    // Must return 400 cleanly, NEVER crash or return 500 RangeError
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('enforces IDEMPOTENCY: second call on already-verified order returns 200 without duplicate receipt', async () => {
    // 1. Mark order paid
    testOrder.status = 'PAID';
    testOrder.paymentStatus = 'CAPTURED';
    testOrder.razorpayPaymentId = 'pay_already_captured';
    await testOrder.save();

    await TransactionReceipt.create({
      receiptNumber: 'RCPT-20261029-1111',
      orderId: testOrder._id,
      orderNumber: testOrder.orderNumber,
      customerDetails: testOrder.customer,
      itemizedList: [{ title: 'Shivling Offering', quantity: 1, unitPrice: 5100, subtotal: 5100 }],
      amountPaid: 5100,
      gatewayTransactionId: 'pay_already_captured',
      gatewayOrderId: 'order_test_12345'
    });

    // 2. Submit replay verification request
    const response = await request(app)
      .post('/api/orders/verify-payment')
      .send({
        orderId: testOrder._id.toString(),
        razorpay_order_id: 'order_test_12345',
        razorpay_payment_id: 'pay_already_captured',
        razorpay_signature: 'any_signature'
      });

    expect(response.status).toBe(200);
    expect(response.body.isDuplicate).toBe(true);
    expect(response.body.receiptNumber).toBe('RCPT-20261029-1111');

    // Confirm only one receipt exists
    const count = await TransactionReceipt.countDocuments({ orderId: testOrder._id });
    expect(count).toBe(1);
  });
});
