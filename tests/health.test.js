const request = require('supertest');
const app = require('../src/app');

describe('Health Check API', () => {
  it('GET /api/health returns HTTP 200 with ok status and database connectivity', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.database).toBeDefined();
    expect(res.body.database.readyState).toBe(1);
  });

  it('GET / returns root API gateway informational payload', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Shree Temple Platform API Gateway');
  });

  it('GET /api/non-existent-route returns normalized HTTP 404', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Endpoint not found');
  });
});
