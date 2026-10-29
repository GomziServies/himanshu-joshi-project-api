const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Authentication & RBAC API', () => {
  beforeEach(async () => {
    // Create an admin user for RBAC tests
    await User.create({
      name: 'Temple Admin',
      email: 'admin@temple.org',
      password: 'AdminPassword123!',
      role: 'admin',
      isActive: true
    });
  });

  it('registers a new devotee account with HTTP 201 and returns JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Devotee Ramesh',
        email: 'ramesh@example.com',
        password: 'Password123!',
        phone: '+91 9876543210'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('ramesh@example.com');
    expect(res.body.user.role).toBe('customer');
  });

  it('rejects duplicate email registration with HTTP 409 Conflict', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Devotee Ramesh',
        email: 'duplicate@example.com',
        password: 'Password123!'
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Devotee Suresh',
        email: 'duplicate@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('authenticates valid credentials via POST /api/auth/login', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login Devotee',
        email: 'login@example.com',
        password: 'Password123!'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('rejects invalid password with HTTP 401 Unauthorized', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login Devotee',
        email: 'login2@example.com',
        password: 'Password123!'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login2@example.com',
        password: 'WrongPassword!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('REJECTS customer credentials on POST /api/auth/admin-login with HTTP 403 Forbidden', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Regular Customer',
        email: 'customer@example.com',
        password: 'Password123!'
      });

    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({
        email: 'customer@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/denied|administrator/i);
  });

  it('authenticates administrator on POST /api/auth/admin-login', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({
        email: 'admin@temple.org',
        password: 'AdminPassword123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  it('GET /api/auth/me returns current user profile when authenticated', async () => {
    const loginRes = await request(app)
      .post('/api/auth/admin-login')
      .send({
        email: 'admin@temple.org',
        password: 'AdminPassword123!'
      });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user.email).toBe('admin@temple.org');
  });

  it('GET /api/auth/me rejects request without token with HTTP 401', async () => {
    const meRes = await request(app).get('/api/auth/me');
    expect(meRes.status).toBe(401);
    expect(meRes.body.success).toBe(false);
  });
});
