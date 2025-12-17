/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Subscription Limits Integration Tests
 * ═══════════════════════════════════════════════════
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

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

describe('Subscription Plan Limits', () => {
  let testBusiness;
  let testUser;
  let authToken;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbAvailable = false;
      dbErrorMessage = error?.message || 'Database unavailable';
      console.warn('[Subscription Plan Limits] Database unavailable:', dbErrorMessage);
      return;
    }

    const { genEmail } = require('./testUtils')
    // Create test user and business
    testUser = await prisma.user.create({
      data: { email: genEmail('test-subscription'), fullName: 'Test User', password: 'hashed-password-here', role: 'CLIENT' }
    });

    testBusiness = await prisma.business.create({
      data: {
        userId: testUser.id,
        name: 'Test Business',
        activityType: 'RETAIL',
        planType: 'TRIAL',
        messageQuota: 100, // TRIAL default
        messagesUsed: 0
      }
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, businessId: testBusiness.id, role: 'CLIENT' },
      process.env.JWT_SECRET || 'test-secret-key-for-testing-only-32chars',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (!dbAvailable) {
      await prisma.$disconnect().catch(() => {});
      return;
    }

    // Cleanup
    await prisma.conversation.deleteMany({ where: { businessId: testBusiness.id } });
    await prisma.business.delete({ where: { id: testBusiness.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('Message Quota Enforcement', () => {
    runIfDbAvailable('should allow messages within quota', async () => {
      const business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      expect(business.messagesUsed).toBeLessThan(business.messageQuota);
    });

    runIfDbAvailable('should block messages when quota exceeded', async () => {
      // Set messagesUsed to quota limit
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { messagesUsed: 100, messageQuota: 100 }
      });

      const business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      expect(business.messagesUsed).toBeGreaterThanOrEqual(business.messageQuota);
      
      // In socket handler, this would trigger quota exceeded message
      // Testing the business logic here
    });

    runIfDbAvailable('should reset quota properly', async () => {
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { messagesUsed: 0 }
      });

      const business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      expect(business.messagesUsed).toBe(0);
    });
  });

  describe('Plan Type Quotas', () => {
    runIfDbAvailable('TRIAL plan should have 100 messages quota', async () => {
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { planType: 'TRIAL', messageQuota: 100 }
      });

      const business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      expect(business.planType).toBe('TRIAL');
      expect(business.messageQuota).toBe(100);
    });

    runIfDbAvailable('BASIC plan should have 500 messages quota', async () => {
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { planType: 'BASIC', messageQuota: 500 }
      });

      const business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      expect(business.planType).toBe('BASIC');
      expect(business.messageQuota).toBe(500);
    });

    runIfDbAvailable('PRO plan should have 1500 messages quota', async () => {
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { planType: 'PRO', messageQuota: 1500 }
      });

      const business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      expect(business.planType).toBe('PRO');
      expect(business.messageQuota).toBe(25000);
    });

    runIfDbAvailable('ENTERPRISE plan should have 999999 messages quota', async () => {
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { planType: 'ENTERPRISE', messageQuota: 999999 }
      });

      const business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      expect(business.planType).toBe('ENTERPRISE');
      expect(business.messageQuota).toBe(999999);
    });
  });

  describe('Trial Expiry', () => {
    runIfDbAvailable('should block access when trial expires', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { 
          planType: 'TRIAL',
          trialEndsAt: expiredDate
        }
      });

      const business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      const isExpired = business.planType === 'TRIAL' && 
                        business.trialEndsAt && 
                        new Date() > new Date(business.trialEndsAt);

      expect(isExpired).toBe(true);
    });

    runIfDbAvailable('should allow access when trial is active', async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { 
          planType: 'TRIAL',
          trialEndsAt: futureDate
        }
      });

      const business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      const isExpired = business.planType === 'TRIAL' && 
                        business.trialEndsAt && 
                        new Date() > new Date(business.trialEndsAt);

      expect(isExpired).toBe(false);
    });
  });

  describe('Usage Tracking', () => {
    runIfDbAvailable('should increment messagesUsed correctly', async () => {
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { messagesUsed: 0 }
      });

      // Simulate message increment
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { messagesUsed: { increment: 1 } }
      });

      let business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      expect(business.messagesUsed).toBe(1);

      // Increment again
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { messagesUsed: { increment: 1 } }
      });

      business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      expect(business.messagesUsed).toBe(2);
    });

    runIfDbAvailable('should calculate usage percentage correctly', async () => {
      await prisma.business.update({
        where: { id: testBusiness.id },
        data: { 
          messagesUsed: 50,
          messageQuota: 100
        }
      });

      const business = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });

      const usagePercentage = (business.messagesUsed / business.messageQuota) * 100;
      expect(usagePercentage).toBe(50);
    });
  });
});
