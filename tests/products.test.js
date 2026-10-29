const request = require('supertest');
const app = require('../src/app');
const Product = require('../src/models/Product');
const User = require('../src/models/User');

describe('Products & Offerings Catalog API', () => {
  let adminToken;
  let testOffering;

  beforeEach(async () => {
    // Create admin & login
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

    // Seed active and inactive products
    testOffering = await Product.create({
      title: 'Shivling Sthapana & Rudrabhishek Offering',
      slug: 'shivling-sthapana',
      category: 'Offering',
      description: 'Consecrated Narmadeshwar Shivling with Vedic Pran Pratishtha.',
      price: 5100,
      stockQuantity: 108,
      isActive: true,
      isFeatured: true,
      displayOrder: 1
    });

    await Product.create({
      title: 'Inactive Secret Puja',
      slug: 'inactive-puja',
      category: 'Puja',
      description: 'This puja is not active yet.',
      price: 1500,
      stockQuantity: 10,
      isActive: false
    });
  });

  it('GET /api/products returns only active offerings for public catalog', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].slug).toBe('shivling-sthapana');
  });

  it('GET /api/products/:slugOrId retrieves offering by slug', async () => {
    const res = await request(app).get('/api/products/shivling-sthapana');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toContain('Shivling Sthapana');
  });

  it('GET /api/products/:slugOrId retrieves offering by MongoDB ObjectId', async () => {
    const res = await request(app).get(`/api/products/${testOffering._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('shivling-sthapana');
  });

  it('POST /api/admin/products creates a new offering when authenticated as admin', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Maha Rudrabhishek 108 Bilva',
        category: 'Puja',
        description: 'Vedic Rudrabhishek performed by 2 priests.',
        price: 2100,
        stockQuantity: 50,
        isActive: true
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Maha Rudrabhishek 108 Bilva');
    expect(res.body.data.slug).toBeDefined();
  });

  it('POST /api/admin/products rejects unauthorized access without token with HTTP 401', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .send({
        title: 'Unauthorized Puja',
        price: 1000,
        description: 'No auth provided'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('PUT /api/admin/products/:id updates offering details', async () => {
    const res = await request(app)
      .put(`/api/admin/products/${testOffering._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        price: 5500,
        subtitle: 'Updated Vedic subtitle'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(5500);
    expect(res.body.data.subtitle).toBe('Updated Vedic subtitle');
  });

  it('DELETE /api/admin/products/:id removes offering from database', async () => {
    const res = await request(app)
      .delete(`/api/admin/products/${testOffering._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await Product.findById(testOffering._id);
    expect(check).toBeNull();
  });
});
