const request = require('supertest');
const app = require('../../src/index');

describe('Admin Media Endpoints', () => {
  let token;
  beforeAll(async () => {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-secret';
    token = jwt.sign({ role: 'SUPERADMIN' }, secret, { expiresIn: '1h' });
  });

  test('GET /api/admin/media should return list (auth required)', async () => {
    const res = await request(app).get('/api/admin/media').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('files');
  });
});
