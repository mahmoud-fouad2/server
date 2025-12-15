const request = require('supertest');
const app = require('../../src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

describe('Pre-chat endpoints and CRM integration', () => {
  // db/network operations can be slower on shared managed DBs
  jest.setTimeout(15000);
  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbAvailable = false;
      dbErrorMessage = error?.message || 'Database unavailable';
      console.warn('[Pre-chat Integration] Database unavailable:', dbErrorMessage);
      return;
    }
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    await prisma.crmLead.deleteMany({ where: { name: { contains: 'Test Prechat' } } }).catch(() => {});
    await prisma.conversation.deleteMany({ where: { channel: 'WIDGET' } }).catch(() => {});
    await prisma.$disconnect();
  });

  const { genEmail } = require('./testUtils')

  runIfDbAvailable('GET pre-chat returns required fields when enabled', async () => {
    const owner = await prisma.user.create({ data: { email: genEmail('prechat-owner'), fullName: 'Prechat Owner', password: 'hashed', role: 'CLIENT' } })
    const business = await prisma.business.create({
      data: { name: 'Prechat Enabled Business', activityType: 'RESTAURANT', preChatFormEnabled: true, userId: owner.id }
    });

    const res = await request(app).get(`/api/chat/pre-chat/${business.id}`).expect(200);
    expect(res.body.required).toBe(true);
    expect(Array.isArray(res.body.fields)).toBe(true);
    expect(res.body.fields.some(f => f.name === 'name')).toBe(true);
    expect(res.body.fields.some(f => f.name === 'requestSummary')).toBe(true);

    await prisma.business.delete({ where: { id: business.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: owner.id } }).catch(() => {})
  });

  runIfDbAvailable('POST pre-chat creates conversation and CRM lead when CRM enabled', async () => {
    const owner = await prisma.user.create({ data: { email: genEmail('prechat-owner'), fullName: 'Prechat Owner 2', password: 'hashed', role: 'CLIENT' } })
    const business = await prisma.business.create({
      data: { name: 'Prechat + CRM Business', activityType: 'RESTAURANT', preChatFormEnabled: true, crmLeadCollectionEnabled: true, userId: owner.id }
    });

    const email = genEmail('prechat-lead');
    const payload = { name: 'Test Prechat Lead', email, phone: '+201234567890', requestSummary: 'أريد طلب طعام', sessionId: 'session-test-1' };

    const res = await request(app).post(`/api/chat/pre-chat/${business.id}`).send(payload);
    // Helpful logging for debugging failures on shared DBs
    if (res.status !== 200) {
      // eslint-disable-next-line no-console
      console.error('Pre-chat POST failed response body:', res.body);
    }
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.conversationId).toBeDefined();

    const lead = await prisma.crmLead.findFirst({ where: { conversationId: res.body.conversationId } });
    expect(lead).toBeDefined();
    expect(lead.name).toBe(payload.name);

    // cleanup
    await prisma.crmLead.delete({ where: { id: lead.id } }).catch(() => {});
    await prisma.conversation.delete({ where: { id: res.body.conversationId } }).catch(() => {});
    await prisma.business.delete({ where: { id: business.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: owner.id } }).catch(() => {})
  });

  runIfDbAvailable('POST pre-chat does NOT create lead when CRM disabled', async () => {
    const owner = await prisma.user.create({ data: { email: genEmail('prechat-owner'), fullName: 'Prechat Owner 3', password: 'hashed', role: 'CLIENT' } })
    const business = await prisma.business.create({
      data: { name: 'Prechat no CRM Business', activityType: 'RESTAURANT', preChatFormEnabled: true, crmLeadCollectionEnabled: false, userId: owner.id }
    });

    const email = genEmail('prechat-lead');
    const payload = { name: 'Test Prechat Lead 2', email, phone: '+201234567891', requestSummary: 'أريد حجز طاولة', sessionId: 'session-test-2' };

    const res = await request(app).post(`/api/chat/pre-chat/${business.id}`).send(payload).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.conversationId).toBeDefined();

    const lead = await prisma.crmLead.findFirst({ where: { conversationId: res.body.conversationId } });
    expect(lead).toBeNull();

    // cleanup
    await prisma.conversation.delete({ where: { id: res.body.conversationId } }).catch(() => {});
    await prisma.business.delete({ where: { id: business.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: owner.id } }).catch(() => {})
  });

  runIfDbAvailable('POST pre-chat returns error when pre-chat disabled', async () => {
    const owner = await prisma.user.create({ data: { email: genEmail('prechat-owner'), fullName: 'Prechat Owner 4', password: 'hashed', role: 'CLIENT' } })
    const business = await prisma.business.create({ data: { name: 'Disabled Prechat', activityType: 'COMPANY', preChatFormEnabled: false, userId: owner.id } });

    const payload = { name: 'X', requestSummary: 'test' };
    await request(app).post(`/api/chat/pre-chat/${business.id}`).send(payload).expect(400);

    await prisma.business.delete({ where: { id: business.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: owner.id } }).catch(() => {})
  });
});
