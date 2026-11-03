const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');

describe('Order Creation API — Server-Side Price Calculation & Anti-Tampering', () => {
  let sacredOffering;

  beforeEach(async () => {
    sacredOffering = await Product.create({
      title: 'Shivling Sthapana & Rudrabhishek Offering',
      slug: 'shivling-sthapana',
      category: 'Offering',
      description: 'Sacred Shivling Sthapana ritual performed with 1008 Bilva Patra.',
      price: 5100, // Authoritative price: ₹5,100
      stockQuantity: 50,
      isActive: true
    });
  });

  it('calculates total strictly from DB price and converts to paise (5100 INR -> 510000 paise)', async () => {
    const response = await request(app)
      .post('/api/orders/create-order')
      .send({
        customer: {
          name: 'Ramesh Sharma',
          email: 'ramesh@example.com',
          phone: '+919876543210',
          sankalpName: 'Ramesh Sharma & Family',
        },
        items: [
          { productId: sacredOffering._id.toString(), quantity: 2 }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    // 5100 * 2 = 10,200 INR -> 1,020,000 paise
    expect(response.body.amount).toBe(1020000);
    expect(response.body.currency).toBe('INR');
    expect(response.body.razorpayOrderId).toBeDefined();

    // Verify persisted Order in MongoDB
    const persisted = await Order.findById(response.body.orderId);
    expect(persisted).not.toBeNull();
    expect(persisted.totalAmount).toBe(10200);
    expect(persisted.status).toBe('CREATED');
    expect(persisted.customer.sankalpName).toBe('Ramesh Sharma & Family');
  });

  it('REJECTS client-side price tampering: ignores injected price in request payload', async () => {
    const response = await request(app)
      .post('/api/orders/create-order')
      .send({
        customer: {
          name: 'Hacker Devotee',
          email: 'hacker@example.com',
          phone: '+919999999999'
        },
        items: [
          // Malicious payload attempting to set price to 1 INR or 1 paise
          { productId: sacredOffering._id.toString(), quantity: 1, price: 1, amount: 100 }
        ]
      });

    expect(response.status).toBe(201);
    // Server must strictly enforce DB price (5100 INR -> 510000 paise), NOT 1 or 100!
    expect(response.body.amount).toBe(510000);

    const persisted = await Order.findById(response.body.orderId);
    expect(persisted.totalAmount).toBe(5100);
  });

  it('rejects order with non-existent productId with HTTP 400', async () => {
    const fakeId = new Product()._id.toString();
    const response = await request(app)
      .post('/api/orders/create-order')
      .send({
        customer: { name: 'Devotee', email: 'd@e.com', phone: '1234567890' },
        items: [{ productId: fakeId, quantity: 1 }]
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('rejects order without customer details with HTTP 400', async () => {
    const response = await request(app)
      .post('/api/orders/create-order')
      .send({
        items: [{ productId: sacredOffering._id.toString(), quantity: 1 }]
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
