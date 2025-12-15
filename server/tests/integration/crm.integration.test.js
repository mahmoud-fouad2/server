const request = require('supertest');
const app = require('../../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const { genEmail } = require('./testUtils');

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
    if (skipIfNoDb()) return;
    await testFn();
  };
  if (typeof timeout === 'number') return test(title, wrapper, timeout);
  return test(title, wrapper);
};

describe('CRM lead management endpoints', () => {
  // increase timeout for DB dependent operations
  jest.setTimeout(20000);
  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbAvailable = false;
      dbErrorMessage = error?.message || 'Database unavailable';
      console.warn('[CRM Integration] Database unavailable:', dbErrorMessage);
      return;
    }
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    await prisma.$disconnect();
  });

  runIfDbAvailable('create lead, add note, get notes, assign and update status', async () => {
    // Register a user + business
    const unique = `crm-${Date.now()}`;
    const register = await request(app).post('/api/auth/register').send({
      email: `${unique}@example.com`,
      password: 'TestPass123!',
      name: 'CRM Tester',
      businessName: `CRM Biz ${unique}`,
      activityType: 'RETAIL',
      language: 'ar'
    }).expect(201);

    const token = register.body.token;
    const user = register.body.user;
    const business = register.body.business;

    // Create lead via API (manual entry)
    const createRes = await request(app)
      .post('/api/crm/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Lead A', email: genEmail('lead-a'), phone: '012345', requestSummary: 'Need info' })
      .expect(200);

    const leadId = createRes.body.lead.id;

    // Add a note
    const noteRes = await request(app)
      .post(`/api/crm/leads/${leadId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'First contact' })
      .expect(200);

    expect(noteRes.body.data.message).toBe('First contact');

    // Get notes
    const notesRes = await request(app)
      .get(`/api/crm/leads/${leadId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(notesRes.body.data)).toBe(true);
    expect(notesRes.body.data[0].message).toBe('First contact');

    // Assign lead to the user
    const assignRes = await request(app)
      .put(`/api/crm/leads/${leadId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: user.id })
      .expect(200);

    expect(assignRes.body.data.assignedTo).toBe(user.id);

    // Update status
    const statusRes = await request(app)
      .put(`/api/crm/leads/${leadId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONTACTED' })
      .expect(200);

    expect(statusRes.body.data.status).toBe('CONTACTED');

    // Get lead and validate assigned and status
    const getRes = await request(app)
      .get(`/api/crm/leads/${leadId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getRes.body.data.status).toBe('CONTACTED');
    expect(getRes.body.data.assigned).toBeDefined();

    // Cleanup
    await prisma.crmLead.delete({ where: { id: leadId } }).catch(() => {});
    await prisma.business.delete({ where: { id: business.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  });

  runIfDbAvailable('assigning to invalid user should fail', async () => {
    // Create a business and lead
    const unique = `crm-${Date.now()}-invalid`;
    const register = await request(app).post('/api/auth/register').send({
      email: `${unique}@example.com`,
      password: 'TestPass123!',
      name: 'CRM Invalid Tester',
      businessName: `CRM Biz ${unique}`,
      activityType: 'RETAIL',
      language: 'ar'
    }).expect(201);

    const token = register.body.token;
    const leadRes = await request(app)
      .post('/api/crm/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Lead B', email: genEmail('lead-b'), phone: '012345', requestSummary: 'Need info' })
      .expect(200);

    const leadId = leadRes.body.lead.id;

    // Attempt to assign to a non-existing user
    await request(app)
      .put(`/api/crm/leads/${leadId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: 'non-existent-user' })
      .expect(500);

    // Cleanup
    await prisma.crmLead.delete({ where: { id: leadId } }).catch(() => {});
  });
});
