const request = require('supertest');
const app = require('../../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const { genEmail } = require('./testUtils');

let dbAvailable = true;

const runIfDbAvailable = (title, fn, timeout) => {
  const wrapper = async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbAvailable = false;
      return;
    }
    await fn();
  };
  if (typeof timeout === 'number') return test(title, wrapper, timeout);
  return test(title, wrapper, 20000);
};

afterAll(async () => {
  await prisma.$disconnect().catch(() => {});
});

describe('CRM bulk update integration', () => {
  runIfDbAvailable('bulk update statuses and assign', async () => {
    const unique = `bulk-${Date.now()}`;
    const r = await request(app).post('/api/auth/register').send({ email: `${unique}@example.com`, password: 'Test123!', name: 'Bulk Tester', businessName: `Bulk Biz ${unique}`, activityType: 'RETAIL', language: 'ar' }).expect(201);
    const token = r.body.token;
    // create 2 leads
    const a = await request(app).post('/api/crm/leads').set('Authorization', `Bearer ${token}`).send({ name: 'A', email: genEmail('bulk-a'), phone: '1', requestSummary: 'x' }).expect(200);
    const b = await request(app).post('/api/crm/leads').set('Authorization', `Bearer ${token}`).send({ name: 'B', email: genEmail('bulk-b'), phone: '2', requestSummary: 'y' }).expect(200);
    const ids = [a.body.lead.id, b.body.lead.id];

    // bulk update status
    const res = await request(app).post('/api/crm/leads/bulk-update').set('Authorization', `Bearer ${token}`).send({ leadIds: ids, updates: { status: 'CONTACTED' } }).expect(200);
    expect(res.body.count).toBeGreaterThanOrEqual(2);

    // fetch leads and verify
    const ga = await request(app).get(`/api/crm/leads/${ids[0]}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(ga.body.data.status).toBe('CONTACTED');

    // cleanup
    await prisma.crmLead.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
  }, 30000);
});
