const request = require('supertest');
const app = require('../../src/index').app;
const prisma = require('../../src/config/database');
const bcrypt = require('bcryptjs');
const { genEmail } = require('./testUtils');

let authToken;
let testBusiness;
let testUser;

let dbAvailable = true;
let dbErrorMessage = null;

const skipIfNoDb = () => {
  if (!dbAvailable) {
    expect(dbErrorMessage).toBeDefined();
    return true;
  }
  return false;
};

const runIfDbAvailable = (title, testFn, timeout) => {
  const wrapper = async () => {
    if (skipIfNoDb()) {
      return;
    }
    await testFn();
  };

  if (typeof timeout === 'number') {
    return test(title, wrapper, timeout);
  }

  return test(title, wrapper);
};

beforeAll(async () => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbAvailable = false;
    dbErrorMessage = error?.message || 'Database unavailable';
    console.warn('[Avatar & Widget Settings] Database unavailable:', dbErrorMessage);
    return;
  }
});

afterAll(async () => {
  if (!process.env.DATABASE_URL) return;
  await prisma.business.deleteMany({ where: { user: { email: { contains: 'register-' } } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { email: { contains: 'register-' } } }).catch(() => {});
});

describe('Avatar & Widget Settings API', () => {
  runIfDbAvailable('should allow saving avatar settings and return widgetConfig and configVersion', async () => {
    // Register a new user/business
    const email = genEmail('register');
    const registerRes = await request(app).post('/api/auth/register').send({
      email,
      password: 'TestPass123!',
      name: 'Avatar Tester',
      businessName: 'Avatar Biz',
      activityType: 'RETAIL',
      language: 'ar'
    }).expect(201);

    expect(registerRes.body.success).toBe(true);
    authToken = registerRes.body.token;
    testBusiness = registerRes.body.business;
    testUser = registerRes.body.user;

    // Post avatar settings (multipart)
    const res = await request(app)
      .post(`/api/business/${testBusiness.id}/avatar-settings`)
      .set('Authorization', `Bearer ${authToken}`)
      .field('selectedAvatar', 'avatar2')
      .field('selectedIcon', 'icon-help')
      .attach('customAvatar', Buffer.from('fake-image'), {
        filename: 'avatar.png',
        contentType: 'image/png'
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.widgetConfig).toBeDefined();
    // configVersion should be present and numeric
    expect(res.body.configVersion).toBeDefined();
    expect(typeof res.body.configVersion).toBe('number');

    // Verify DB updated
    const biz = await prisma.business.findUnique({ where: { id: testBusiness.id } });
    expect(biz.widgetConfig).toBeTruthy();
  });
});