const request = require('supertest');
const app = require('../src/app');
const Order = require('../src/models/Order');
const TransactionReceipt = require('../src/models/TransactionReceipt');
const User = require('../src/models/User');
const { generateReceiptHtml } = require('../src/services/receiptTemplate');
const { sendReceiptEmail } = require('../src/services/emailService');

describe('Automated Email Receipt Engine & Admin Resend', () => {
  let adminToken;
  let paidOrder;
  let receiptDoc;

  beforeEach(async () => {
    // Seed admin
    await User.create({
      name: 'Temple Admin',
      email: 'admin@temple.org',
      password: 'AdminPassword123!',
      role: 'admin',
      isActive: true
    });

    const loginRes = await request(app)
      .post('/api/auth/admin-login')
      .send({ email: 'admin@temple.org', password: 'AdminPassword123!' });
    adminToken = loginRes.body.token;

    paidOrder = await Order.create({
      orderNumber: 'ORD-20261029-5555',
      customer: {
        name: 'Sunita Devi',
        email: 'sunita@example.com',
        phone: '+919876500000',
        sankalpName: 'Sunita Devi & Family',
        gotra: 'Shandilya'
      },
      items: [{
        productTitle: 'Salahkareshwar Shivling Sthapana Offering',
        quantity: 1,
        unitPrice: 5100,
        subtotal: 5100
      }],
      totalAmount: 5100,
      currency: 'INR',
      status: 'PAID',
      paymentStatus: 'CAPTURED',
      razorpayOrderId: 'order_sunita_123',
      razorpayPaymentId: 'pay_sunita_456'
    });

    receiptDoc = await TransactionReceipt.create({
      receiptNumber: 'RCPT-20261029-5555',
      orderId: paidOrder._id,
      orderNumber: paidOrder.orderNumber,
      customerDetails: paidOrder.customer,
      itemizedList: [{
        title: 'Salahkareshwar Shivling Sthapana Offering',
        quantity: 1,
        unitPrice: 5100,
        subtotal: 5100
      }],
      amountPaid: 5100,
      currency: 'INR',
      gatewayTransactionId: 'pay_sunita_456',
      gatewayOrderId: 'order_sunita_123',
      emailDeliveryStatus: 'PENDING'
    });
  });

  it('renders auspicious temple HTML template with Om symbol, Gotra, and itemized total', () => {
    const html = generateReceiptHtml(paidOrder, receiptDoc);
    expect(html).toContain('ॐ');
    expect(html).toContain('Shandilya');
    expect(html).toContain('Sunita Devi &amp; Family');
    expect(html).toContain('Salahkareshwar Shivling Sthapana Offering');
    expect(html).toContain('₹5,100');
  });

  it('dispatches email non-blockingly without throwing errors', async () => {
    const result = await sendReceiptEmail(paidOrder, receiptDoc);
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('allows authenticated admin to resend receipt email via POST /api/admin/orders/:id/resend-receipt', async () => {
    const response = await request(app)
      .post(`/api/admin/orders/${paidOrder._id}/resend-receipt`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.deliveryStatus).toBe('SENT');
  });

  it('verifies ledger immutability: rejecting attempts to tamper with financial amounts', async () => {
    await expect(
      TransactionReceipt.updateOne(
        { _id: receiptDoc._id },
        { $set: { amountPaid: 1 } }
      )
    ).rejects.toThrow(/IMMUTABILITY_VIOLATION/);
  });
});
