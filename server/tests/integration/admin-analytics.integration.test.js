const request = require('supertest');

// Mock the analytics service to avoid real DB calls during integration tests
jest.mock('../../src/services/admin-analytics.service', () => {
  return {
    getOverview: jest.fn(async () => ({ totalSessions: 10, totalPageViews: 50 })),
    getSessionsByCountry: jest.fn(async () => [{ country: 'US', sessions: 5 }]),
    getTopIps: jest.fn(async () => [{ ip: '1.2.3.4', count: 3 }]),
    getBrowserDeviceBreakdown: jest.fn(async () => ({ browsers: [{ name: 'Chrome', count: 5 }], devices: [{ name: 'Desktop', count: 7 }] })),
    getReferrers: jest.fn(async () => [{ referrer: 'https://example.com', count: 4 }])
  };
});

const app = require('../../src/index');

describe('Admin Analytics Endpoints', () => {
  let token;

  beforeAll(async () => {
    // Avoid DB login in integration tests by signing a JWT that contains only a role
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-secret';
    token = jwt.sign({ role: 'SUPERADMIN' }, secret, { expiresIn: '1h' });
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

  test('GET /api/admin/analytics/top-ips (auth required)', async () => {
    const res = await request(app).get('/api/admin/analytics/top-ips').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/admin/analytics/breakdown (auth required)', async () => {
    const res = await request(app).get('/api/admin/analytics/breakdown').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('browsers');
    expect(res.body).toHaveProperty('devices');
  });

  test('GET /api/admin/analytics/referrers (auth required)', async () => {
    const res = await request(app).get('/api/admin/analytics/referrers').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
