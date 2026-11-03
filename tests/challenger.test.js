/**
 * tests/challenger.test.js
 * Empirical Challenge Suite for:
 * 1. JWT Authentication & RBAC Guard Enforcement
 * 2. Database Resilience & Idempotent Seeding
 * 3. Financial Ledger Immutability Guard
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Banner = require('../src/models/Banner');
const Order = require('../src/models/Order');
const TransactionReceipt = require('../src/models/TransactionReceipt');
const seedDatabase = require('../src/utils/seed');

describe('EMPIRICAL CHALLENGER SUITE: Backend Auth, DB Resilience & Ledger Immutability', () => {
  let customerUser;
  let adminUser;
  let suspendedAdminUser;
  let customerToken;
  let adminToken;
  let sampleProduct;
  let sampleBanner;
  let sampleOrder;

  const getSecret = () => process.env.JWT_SECRET || 'super_secret_temple_platform_jwt_key_shree_shivling_2026_devotee_auth';

  beforeEach(async () => {
    // 1. Setup dev and admin accounts
    customerUser = await User.create({
      name: 'Devotee Ramesh',
      email: 'ramesh.devotee@temple.org',
      password: 'DevoteePassword123!',
      role: 'customer',
      isActive: true,
      status: 'active'
    });

    adminUser = await User.create({
      name: 'Temple Admin Head',
      email: 'head.admin@temple.org',
      password: 'AdminPassword123!',
      role: 'admin',
      isActive: true,
      status: 'active'
    });

    suspendedAdminUser = await User.create({
      name: 'Suspended Admin',
      email: 'suspended.admin@temple.org',
      password: 'AdminPassword123!',
      role: 'admin',
      isActive: false,
      status: 'suspended'
    });

    customerToken = jwt.sign(
      { id: customerUser._id, email: customerUser.email, role: customerUser.role },
      getSecret(),
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: adminUser.role },
      getSecret(),
      { expiresIn: '1h' }
    );

    sampleProduct = await Product.create({
      title: 'Sacred Test Shivling',
      slug: 'sacred-test-shivling',
      category: 'Offering',
      description: 'Handcrafted test offering',
      price: 5100,
      isActive: true
    });

    sampleBanner = await Banner.create({
      title: 'Sacred Festival Banner',
      imageUrl: 'https://example.com/banner.jpg',
      isActive: true,
      displayOrder: 1
    });

    sampleOrder = await Order.create({
      orderNumber: 'ORD-TEST-001',
      customer: {
        name: 'Devotee Ramesh',
        email: 'ramesh.devotee@temple.org',
        phone: '+91 9876543210',
        sankalpName: 'Ramesh Sharma',
      },
      items: [
        {
          product: sampleProduct._id,
          productTitle: sampleProduct.title,
          productSlug: sampleProduct.slug,
          quantity: 1,
          unitPrice: 5100,
          subtotal: 5100
        }
      ],
      totalAmount: 5100,
      subtotalAmount: 5100,
      status: 'CREATED',
      paymentStatus: 'UNPAID'
    });
  });

  // =========================================================================
  // MISSION SECTION 1: CHALLENGE JWT AUTHENTICATION & RBAC
  // =========================================================================
  describe('1. JWT Authentication & RBAC Challenges', () => {
    it('REJECTS customer token accessing GET /api/admin/products with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden|administrator privileges required/i);
    });

    it('REJECTS customer token accessing POST /api/admin/products with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          title: 'Hacked Product',
          slug: 'hacked-product',
          category: 'Offering',
          description: 'Malicious injection',
          price: 1
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden|administrator privileges required/i);
    });

    it('REJECTS customer token accessing GET /api/admin/banners with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/banners')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden|administrator privileges required/i);
    });

    it('REJECTS customer token accessing PATCH /api/admin/banners/:id/toggle with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/admin/banners/${sampleBanner._id}/toggle`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden|administrator privileges required/i);
    });

    it('REJECTS customer token accessing GET /api/admin/users with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden|administrator privileges required/i);
    });

    it('REJECTS customer token accessing GET /api/admin/orders with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden|administrator privileges required/i);
    });

    it('REJECTS customer token accessing PATCH /api/admin/orders/:id/status with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/admin/orders/${sampleOrder._id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'PAID' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden|administrator privileges required/i);
    });

    it('REJECTS customer token accessing GET /api/admin/receipts with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/receipts')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden|administrator privileges required/i);
    });

    it('REJECTS customer token accessing GET /api/admin/stats with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden|administrator privileges required/i);
    });

    it('REJECTS unauthenticated access (no token) across /api/admin/* with HTTP 401', async () => {
      const endpoints = [
        '/api/admin/products',
        '/api/admin/banners',
        '/api/admin/users',
        '/api/admin/orders',
        '/api/admin/receipts',
        '/api/admin/stats'
      ];

      for (const endpoint of endpoints) {
        const res = await request(app).get(endpoint);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/authentication required|bearer token/i);
      }
    });

    it('REJECTS expired tokens with HTTP 401 Unauthorized', async () => {
      const expiredToken = jwt.sign(
        { id: adminUser._id, email: adminUser.email, role: 'admin' },
        getSecret(),
        { expiresIn: '-10s' }
      );

      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/expired/i);
    });

    it('REJECTS forged signature tokens with HTTP 401 Unauthorized', async () => {
      const forgedToken = jwt.sign(
        { id: adminUser._id, email: adminUser.email, role: 'admin' },
        'attacker_fake_secret_key_666',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid authentication token/i);
    });

    it('REJECTS customer credentials on POST /api/auth/admin-login with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/auth/admin-login')
        .send({
          email: 'ramesh.devotee@temple.org',
          password: 'DevoteePassword123!'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/denied|administrator credentials/i);
    });

    it('REJECTS invalid admin password on POST /api/auth/admin-login with HTTP 401', async () => {
      const res = await request(app)
        .post('/api/auth/admin-login')
        .send({
          email: 'head.admin@temple.org',
          password: 'WrongPassword666!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid.*credentials/i);
    });

    it('REJECTS suspended admin on POST /api/auth/admin-login with HTTP 403', async () => {
      const res = await request(app)
        .post('/api/auth/admin-login')
        .send({
          email: 'suspended.admin@temple.org',
          password: 'AdminPassword123!'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/disabled|suspended/i);
    });

    it('REJECTS token for account that was suspended after token issuance with HTTP 403', async () => {
      const validAdminToken = jwt.sign(
        { id: adminUser._id, email: adminUser.email, role: adminUser.role },
        getSecret(),
        { expiresIn: '1h' }
      );

      // Now suspend the user in the database
      adminUser.status = 'suspended';
      adminUser.isActive = false;
      await adminUser.save();

      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${validAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/suspended/i);
    });

    it('REJECTS unauthenticated access to GET /api/admin/orders/:id with HTTP 401', async () => {
      const resUnauth = await request(app).get(`/api/admin/orders/${sampleOrder._id}`);
      expect(resUnauth.status).toBe(401);
      expect(resUnauth.body.success).toBe(false);
      expect(resUnauth.body.message).toMatch(/authentication required|bearer token/i);
    });

    it('REJECTS customer token accessing GET /api/admin/orders/:id with HTTP 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/admin/orders/${sampleOrder._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/forbidden|administrator privileges required/i);
    });

    it('PERMITS authenticated admin token accessing GET /api/admin/orders/:id with HTTP 200', async () => {
      const res = await request(app)
        .get(`/api/admin/orders/${sampleOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(sampleOrder._id.toString());
    });
  });

  // =========================================================================
  // MISSION SECTION 2: CHALLENGE DATABASE RESILIENCE & SEED IDEMPOTENCY
  // =========================================================================
  describe('2. Database Resilience & Seed Idempotency Challenges', () => {
    it('verifies that seedDatabase() executes idempotently 3 times without duplicate key errors', async () => {
      // First run
      await expect(seedDatabase()).resolves.not.toThrow();

      // Second consecutive run
      await expect(seedDatabase()).resolves.not.toThrow();

      // Third consecutive run
      await expect(seedDatabase()).resolves.not.toThrow();

      // Verify exact counts in DB
      const seedAdmin = await User.findOne({ email: 'admin@temple.org' });
      expect(seedAdmin).not.toBeNull();
      expect(seedAdmin.role).toBe('admin');

      const productCount = await Product.countDocuments();
      // 1 seeded offering (Shivling at ₹501) + 1 sampleProduct
      expect(productCount).toBe(2);
      const seededProduct = await Product.findOne({ slug: 'salahkareshwar-shivling' });
      expect(seededProduct.price).toBe(501);

      const bannerCount = await Banner.countDocuments();
      // Banners are not seeded; only the sampleBanner exists
      expect(bannerCount).toBe(1);
    });

    it('does not overwrite a price changed from the admin panel when seeding again', async () => {
      await seedDatabase();
      await Product.updateOne({ slug: 'salahkareshwar-shivling' }, { price: 701 });
      await seedDatabase();
      const seededProduct = await Product.findOne({ slug: 'salahkareshwar-shivling' });
      expect(seededProduct.price).toBe(701);
    });

    it('does not create an administrator when ADMIN_DEFAULT_PASSWORD is missing', async () => {
      const saved = process.env.ADMIN_DEFAULT_PASSWORD;
      delete process.env.ADMIN_DEFAULT_PASSWORD;
      try {
        await seedDatabase();
        expect(await User.findOne({ email: 'admin@temple.org' })).toBeNull();
      } finally {
        process.env.ADMIN_DEFAULT_PASSWORD = saved;
      }
    });

    it('verifies MongoMemoryServer initializes when connection is in readyState === 1', async () => {
      expect(mongoose.connection.readyState).toBe(1);
      const ping = await mongoose.connection.db.admin().ping();
      expect(ping.ok).toBe(1);
    });
  });

  // =========================================================================
  // MISSION SECTION 3: CHALLENGE FINANCIAL LEDGER IMMUTABILITY
  // =========================================================================
  describe('3. Financial Ledger Immutability Challenges', () => {
    let receipt;

    beforeEach(async () => {
      receipt = await TransactionReceipt.create({
        receiptNumber: 'RCPT-20261029-7777',
        orderId: sampleOrder._id,
        orderNumber: sampleOrder.orderNumber,
        customerDetails: {
          name: sampleOrder.customer.name,
          email: sampleOrder.customer.email,
          phone: sampleOrder.customer.phone
        },
        itemizedList: [
          {
            title: sampleProduct.title,
            quantity: 1,
            unitPrice: 5100,
            subtotal: 5100
          }
        ],
        amountPaid: 5100,
        financials: {
          subtotal: 5100,
          tax: 0,
          totalPaid: 5100,
          currency: 'INR'
        },
        gatewayTransactionId: 'pay_test_ledger_001',
        gatewayOrderId: 'order_test_ledger_001',
        emailDeliveryStatus: 'PENDING'
      });
    });

    it('BLOCKS updateOne tampering with amountPaid via pre-update hook', async () => {
      await expect(
        TransactionReceipt.updateOne({ _id: receipt._id }, { $set: { amountPaid: 100 } })
      ).rejects.toThrow(/IMMUTABILITY_VIOLATION/);

      // Verify amount in DB was not altered
      const unmodified = await TransactionReceipt.findById(receipt._id);
      expect(unmodified.amountPaid).toBe(5100);
    });

    it('BLOCKS updateOne tampering with financials.totalPaid via pre-update hook', async () => {
      await expect(
        TransactionReceipt.updateOne({ _id: receipt._id }, { $set: { 'financials.totalPaid': 100 } })
      ).rejects.toThrow(/IMMUTABILITY_VIOLATION/);

      const unmodified = await TransactionReceipt.findById(receipt._id);
      expect(unmodified.financials.totalPaid).toBe(5100);
    });

    it('BLOCKS findOneAndUpdate tampering with amountPaid via pre-update hook', async () => {
      await expect(
        TransactionReceipt.findOneAndUpdate(
          { _id: receipt._id },
          { $set: { amountPaid: 999 } },
          { new: true }
        )
      ).rejects.toThrow(/IMMUTABILITY_VIOLATION/);

      const unmodified = await TransactionReceipt.findById(receipt._id);
      expect(unmodified.amountPaid).toBe(5100);
    });

    it('BLOCKS updateMany tampering with amountPaid via pre-update hook', async () => {
      await expect(
        TransactionReceipt.updateMany({}, { $set: { amountPaid: 0 } })
      ).rejects.toThrow(/IMMUTABILITY_VIOLATION/);

      const unmodified = await TransactionReceipt.findById(receipt._id);
      expect(unmodified.amountPaid).toBe(5100);
    });

    it('BLOCKS tampering with customerDetails or lineItems via pre-update hook', async () => {
      await expect(
        TransactionReceipt.updateOne(
          { _id: receipt._id },
          { $set: { 'customerDetails.name': 'Malicious Tamperer' } }
        )
      ).rejects.toThrow(/IMMUTABILITY_VIOLATION/);
    });

    it('PERMITS legitimate updates using $set on emailDeliveryStatus and emailDeliveryDetails', async () => {
      await expect(
        TransactionReceipt.updateOne(
          { _id: receipt._id },
          {
            $set: {
              emailDeliveryStatus: 'SENT',
              emailDeliveryDetails: {
                sentAt: new Date(),
                recipientEmail: 'ramesh.devotee@temple.org',
                messageId: '<msg_12345@temple.org>'
              }
            }
          }
        )
      ).resolves.not.toThrow();

      const updated = await TransactionReceipt.findById(receipt._id);
      expect(updated.emailDeliveryStatus).toBe('SENT');
      expect(updated.emailDeliveryDetails.recipientEmail).toBe('ramesh.devotee@temple.org');
    });

    it('ENFORCES document-level .save() immutability on TransactionReceipt', async () => {
      // Query document
      const doc = await TransactionReceipt.findById(receipt._id);
      doc.amountPaid = 999;
      doc.financials.totalPaid = 999;
      
      await expect(doc.save()).rejects.toThrow(/IMMUTABILITY_VIOLATION/);

      const reloaded = await TransactionReceipt.findById(receipt._id);
      expect(reloaded.amountPaid).toBe(5100);
    });

    it('REJECTS MongoDB operator tampering ($inc alongside $set) on TransactionReceipt with IMMUTABILITY_VIOLATION', async () => {
      await expect(
        TransactionReceipt.updateOne(
          { _id: receipt._id },
          {
            $set: { emailDeliveryStatus: 'SENT' },
            $inc: { amountPaid: -1000 }
          }
        )
      ).rejects.toThrow(/IMMUTABILITY_VIOLATION/);

      const reloaded = await TransactionReceipt.findById(receipt._id);
      expect(reloaded.amountPaid).toBe(5100);
    });
  });

  // =========================================================================
  // MISSION SECTION 4: CHALLENGE SEARCH REGEX INJECTION & REDOS DEFENSE
  // =========================================================================
  describe('4. Search Regex Injection & ReDoS Defense Challenges', () => {
    it('SAFELY HANDLES raw regex metacharacters in search query without HTTP 500 across endpoints', async () => {
      const dangerousInputs = ['(', '[', '{', '*', '+', '?', '^', '$', '|', '\\', '(.*)+', '([a-z]+)+'];

      for (const input of dangerousInputs) {
        const enc = encodeURIComponent(input);

        // 1. Public Products Search
        const resProdSearch = await request(app).get(`/api/products?search=${enc}`);
        expect(resProdSearch.status).toBe(200);
        expect(resProdSearch.body.success).toBe(true);

        // 2. Public Products Category
        const resProdCat = await request(app).get(`/api/products?category=${enc}`);
        expect(resProdCat.status).toBe(200);
        expect(resProdCat.body.success).toBe(true);

        // 3. Admin Products Search
        const resAdminProd = await request(app)
          .get(`/api/admin/products?search=${enc}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(resAdminProd.status).toBe(200);
        expect(resAdminProd.body.success).toBe(true);

        // 4. Admin Users Search
        const resAdminUsers = await request(app)
          .get(`/api/admin/users?search=${enc}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(resAdminUsers.status).toBe(200);
        expect(resAdminUsers.body.success).toBe(true);

        // 5. Admin Orders Search
        const resAdminOrders = await request(app)
          .get(`/api/admin/orders?search=${enc}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(resAdminOrders.status).toBe(200);
        expect(resAdminOrders.body.success).toBe(true);

        // 6. Admin Receipts Search
        const resAdminReceipts = await request(app)
          .get(`/api/admin/receipts?search=${enc}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(resAdminReceipts.status).toBe(200);
        expect(resAdminReceipts.body.success).toBe(true);
      }
    });
  });
});
