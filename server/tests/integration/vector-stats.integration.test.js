const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const express = require('express');

const prisma = new PrismaClient();

// Import routes
const analyticsRoutes = require('../../src/routes/conversation-analytics.routes');

describe('Vector Stats Integration (pgvector)', () => {
  let app;
  let testUser;
  let testBusiness;
  let authToken;
  let dbAvailable = true;
  let dbErrorMessage = null;

  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbAvailable = false;
      dbErrorMessage = error.message;
      console.warn('[Vector Stats Integration] Database not available', dbErrorMessage);
      return;
    }

    // Create user and business
    testUser = await prisma.user.create({
      data: {
        email: 'vector-test@example.com',
        fullName: 'Vector Test',
        password: 'hashed',
        role: 'CLIENT'
      }
    });

    testBusiness = await prisma.business.create({
      data: {
        userId: testUser.id,
        name: 'Vector Test Business',
        activityType: 'RETAIL',
        planType: 'TRIAL',
        language: 'ar'
      }
    });

    authToken = jwt.sign({ userId: testUser.id, businessId: testBusiness.id, role: 'CLIENT' }, process.env.JWT_SECRET || 'test-secret');

    // Setup express app with analytics route using body parser and mocked authentication
    app = express();
    app.use(express.json());
    // Minimal auth middleware to set req.user (mimic authenticateToken)
    app.use((req, res, next) => {
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'test-secret'); } catch(e) { /* ignore */ }
      }
      next();
    });
    app.use('/api/analytics', analyticsRoutes);
  });

  afterAll(async () => {
    if (!dbAvailable) return;
    await prisma.knowledgeChunk.deleteMany({ where: { businessId: testBusiness.id } }).catch(() => {});
    await prisma.knowledgeBase.deleteMany({ where: { businessId: testBusiness.id } }).catch(() => {});
    await prisma.business.delete({ where: { id: testBusiness.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    await prisma.$disconnect();
  });

  test('GET /api/analytics/vector-stats shows pgvector availability (when enabled)', async () => {
    if (!dbAvailable) return;

    const res = await request(app)
      .get('/api/analytics/vector-stats')
      .query({ businessId: testBusiness.id })
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    // isPgVectorAvailable may be true if pgvector installed in CI; ensure the property exists and is boolean
    expect(typeof res.body.data.isPgVectorAvailable).toBe('boolean');
  });
});
