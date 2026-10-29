const request = require('supertest');
const app = require('../src/app');
const Banner = require('../src/models/Banner');
const User = require('../src/models/User');

describe('Promotional Banners API', () => {
  let adminToken;
  let bannerOne;
  let bannerTwo;

  beforeEach(async () => {
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

    bannerOne = await Banner.create({
      title: 'Maha Shivling Sthapana Hero',
      imageUrl: 'https://images.unsplash.com/photo-1609342122563-a43ac8917a3a',
      ctaText: 'Book Offering',
      displayOrder: 1,
      isActive: true
    });

    bannerTwo = await Banner.create({
      title: 'Inactive Banner Preview',
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363',
      ctaText: 'Coming Soon',
      displayOrder: 2,
      isActive: false
    });
  });

  it('GET /api/banners returns only active banners sorted by displayOrder ascending', async () => {
    const res = await request(app).get('/api/banners');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].title).toBe('Maha Shivling Sthapana Hero');
  });

  it('GET /api/admin/banners returns all banners for admin console', async () => {
    const res = await request(app)
      .get('/api/admin/banners')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
  });

  it('POST /api/admin/banners creates a new promotional banner', async () => {
    const res = await request(app)
      .post('/api/admin/banners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Shravan Special Offerings',
        imageUrl: 'https://images.unsplash.com/photo-banner-3',
        ctaText: 'Explore Rituals',
        displayOrder: 3,
        isActive: true
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Shravan Special Offerings');
  });

  it('PATCH /api/admin/banners/:id/toggle flips active state for optimistic switch UI', async () => {
    expect(bannerOne.isActive).toBe(true);

    const res = await request(app)
      .patch(`/api/admin/banners/${bannerOne._id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isActive).toBe(false);

    // Toggle back
    const res2 = await request(app)
      .patch(`/api/admin/banners/${bannerOne._id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });

    expect(res2.status).toBe(200);
    expect(res2.body.data.isActive).toBe(true);
  });

  it('DELETE /api/admin/banners/:id removes banner', async () => {
    const res = await request(app)
      .delete(`/api/admin/banners/${bannerTwo._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await Banner.findById(bannerTwo._id);
    expect(check).toBeNull();
  });
});
