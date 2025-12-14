const request = require('supertest');
const app = require('../../src/index');

describe('Admin Analytics Endpoints', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@faheemly.com', password: 'Doda@55002004' });
    token = res.body.token;
  });

  test('GET /api/admin/analytics/overview (auth required)', async () => {
    const res = await request(app).get('/api/admin/analytics/overview').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalSessions');
  });

  test('GET /api/admin/analytics/by-country (auth required)', async () => {
    const res = await request(app).get('/api/admin/analytics/by-country').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
