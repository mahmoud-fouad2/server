const request = require('supertest');
// Mock the prisma module to avoid contacting a real DB
jest.mock('../../src/config/database', () => ({
  systemSetting: {
    findMany: jest.fn(async () => [
      { key: 'seo:homepage_title', value: 'My Site', description: 'Title for homepage', updatedAt: new Date() },
      { key: 'seo:homepage_description', value: 'Welcome', description: 'Description', updatedAt: new Date() }
    ]),
    findUnique: jest.fn(async ({ where }) => {
      // Return a fake existing setting when asked
      if (where && where.key === 'seo:homepage_title') return { key: 'seo:homepage_title', value: 'My Site', description: 'Title for homepage' };
      return null;
    }),
    upsert: jest.fn(async ({ where, create, update }) => ({ key: where.key, value: create?.value || update?.value }))
  }
}));

const app = require('../../src/index');

describe('Admin SEO Endpoints', () => {
  let token;
  beforeAll(async () => {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'test-secret';
    token = jwt.sign({ role: 'SUPERADMIN' }, secret, { expiresIn: '1h' });
  });

  test('GET /api/admin/system/settings returns settings (auth required)', async () => {
    const res = await request(app).get('/api/admin/system/settings').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('settings');
    expect(res.body.settings['seo:homepage_title']).toBeDefined();
  });

  test('PUT /api/admin/system/settings/:key updates a setting (auth required)', async () => {
    const res = await request(app).put('/api/admin/system/settings/seo:homepage_title').set('Authorization', `Bearer ${token}`).send({ value: 'New Title' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('setting');
  });
});
