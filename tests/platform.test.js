/**
 * Behaviour the website and admin panel depend on:
 * test payments, payment filters, product naming, and production safety.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const { isDemoMode, verifyPaymentSignature, createRazorpayOrder } = require('../src/services/razorpayService');

const customer = { name: 'Amit Sharma', email: 'amit@example.com', phone: '9876543210' };

async function adminAuthHeader() {
  const admin = await User.create({ name: 'Admin', email: 'boss@example.com', password: 'secret123', role: 'admin' });
  return `Bearer ${jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET)}`;
}

function makeOrder(orderNumber, fields) {
  return Order.create({
    orderNumber,
    customer,
    items: [{ productTitle: 'Shivling', quantity: 1, unitPrice: 501, subtotal: 501 }],
    totalAmount: 501,
    ...fields
  });
}

describe('Test payments', () => {
  it('flags an order created in demo mode and tells the website', async () => {
    const product = await Product.create({ title: 'Shivling', slug: 'shivling', description: 'd', price: 501 });

    const res = await request(app)
      .post('/api/orders/create-order')
      .send({ customer, items: [{ productId: product._id, quantity: 1 }] });

    expect(res.status).toBe(201);
    expect(res.body.isDemo).toBe(true);
    expect(res.body.amount).toBe(50100);
    expect((await Order.findById(res.body.orderId)).isTest).toBe(true);
  });

  it('excludes test payments from revenue and reports them separately', async () => {
    const auth = await adminAuthHeader();
    await makeOrder('ORD-REAL-1', { status: 'PAID' });
    await makeOrder('ORD-TEST-1', { status: 'PAID', isTest: true });
    await makeOrder('ORD-UNPAID-1', { status: 'CREATED' });

    const res = await request(app).get('/api/admin/stats').set('Authorization', auth);

    expect(res.body.data.totalRevenue).toBe(501);
    expect(res.body.data.paidOrdersCount).toBe(1);
    expect(res.body.data.testPaidCount).toBe(1);
    expect(res.body.data.testRevenue).toBe(501);
  });
});

describe('Cart orders', () => {
  it('totals several products and quantities from database prices, ignoring client prices', async () => {
    const big = await Product.create({ title: 'Big', slug: 'big', description: 'd', price: 501 });
    const small = await Product.create({ title: 'Small', slug: 'small', description: 'd', price: 251 });

    const res = await request(app)
      .post('/api/orders/create-order')
      .send({
        customer,
        items: [
          { productId: big._id, quantity: 3, price: 1 },
          { productId: small._id, quantity: 2, price: 1 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe((501 * 3 + 251 * 2) * 100);
    const order = await Order.findById(res.body.orderId);
    expect(order.items.map((i) => i.quantity)).toEqual([3, 2]);
    expect(order.totalAmount).toBe(2005);
  });

  it('rejects a quantity above the limit', async () => {
    const product = await Product.create({ title: 'Big', slug: 'big', description: 'd', price: 501 });

    const res = await request(app)
      .post('/api/orders/create-order')
      .send({ customer, items: [{ productId: product._id, quantity: 21 }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at most 20/);
    expect(await Order.countDocuments()).toBe(0);
  });
});

describe('Payment filters', () => {
  it('accepts a comma-separated status list', async () => {
    const auth = await adminAuthHeader();
    await makeOrder('ORD-A', { status: 'PAID' });
    await makeOrder('ORD-B', { status: 'CREATED' });
    await makeOrder('ORD-C', { status: 'FAILED' });

    const res = await request(app)
      .get('/api/admin/orders?status=CREATED,FAILED')
      .set('Authorization', auth);

    expect(res.body.data.map((o) => o.orderNumber).sort()).toEqual(['ORD-B', 'ORD-C']);
  });

  it('ignores a query-operator object instead of passing it to MongoDB', async () => {
    const auth = await adminAuthHeader();
    await makeOrder('ORD-A', { status: 'PAID' });

    const res = await request(app)
      .get('/api/admin/orders?status[$ne]=PAID')
      .set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('Product naming', () => {
  it('creates a product with a Hindi-only name', async () => {
    const auth = await adminAuthHeader();

    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', auth)
      .send({ title: 'छोटा शिवलिंग', description: 'A small Shivling', price: 251 });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toMatch(/^product-\d+$/);
  });

  it('keeps the slug when a product is renamed', async () => {
    const auth = await adminAuthHeader();
    const product = await Product.create({ title: 'Shivling', slug: 'shivling', description: 'd', price: 501 });

    const res = await request(app)
      .put(`/api/admin/products/${product._id}`)
      .set('Authorization', auth)
      .send({ title: 'Blessed Shivling' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Blessed Shivling');
    expect(res.body.data.slug).toBe('shivling');
  });
});

describe('Production safety', () => {
  const saved = {};

  beforeEach(() => {
    for (const key of ['NODE_ENV', 'DEMO_PAYMENT_ENABLED', 'RAZORPAY_KEY_ID']) saved[key] = process.env[key];
    process.env.NODE_ENV = 'production';
    process.env.DEMO_PAYMENT_ENABLED = 'true';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_placeholder';
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('never runs demo mode in production, even when it is switched on', () => {
    expect(isDemoMode()).toBe(false);
  });

  it('rejects the demo signature in production', () => {
    expect(
      verifyPaymentSignature({
        razorpay_order_id: 'order_1',
        razorpay_payment_id: 'pay_1',
        razorpay_signature: 'demo_mock_signature'
      })
    ).toBe(false);
  });

  it('does not create simulated gateway orders in production', async () => {
    const order = await createRazorpayOrder({ amountInPaise: 50100, receipt: 'r' }).catch(() => null);
    expect(order?.isDemo).toBeUndefined();
  });
});
