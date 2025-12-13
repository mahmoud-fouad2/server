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

// Not mocking vectorSearch here on purpose — we'll mock it per-test to control return
jest.mock('../../src/services/vector-search.service');
jest.mock('../../src/services/ai.service');

const vectorSearch = require('../../src/services/vector-search.service');
const aiService = require('../../src/services/ai.service');

// Create express app and routes
const express = require('express');
const app = express();
app.use(express.json());
const chatRoutes = require('../../src/routes/chat.routes');
app.use('/api/chat', chatRoutes);

describe('Chat KB E2E Behavior', () => {
  let testUser;
  let testBusiness;
  let authToken;
  let testConversation;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbAvailable = false;
      dbErrorMessage = error.message;
      console.warn('[Chat KB E2E] Database not available', dbErrorMessage);
      return;
    }

    testUser = await prisma.user.create({ data: { email: 'kbtest@example.com', password: 'hashed', name: 'KB Tester', role: 'CLIENT' } });
    testBusiness = await prisma.business.create({ data: { userId: testUser.id, name: 'KB E2E Business', activityType: 'RETAIL', language: 'ar' } });

    authToken = jwt.sign({ userId: testUser.id, businessId: testBusiness.id, role: 'CLIENT' }, process.env.JWT_SECRET);

    testConversation = await prisma.conversation.create({ data: { businessId: testBusiness.id, channel: 'WIDGET', status: 'ACTIVE' } });
  });

  afterAll(async () => {
    if (!dbAvailable) {
      await prisma.$disconnect().catch(() => {});
      return;
    }
    await prisma.message.deleteMany({ where: { conversationId: testConversation.id } });
    await prisma.conversation.deleteMany({ where: { businessId: testBusiness.id } });
    await prisma.knowledgeChunk.deleteMany({ where: { businessId: testBusiness.id } });
    await prisma.knowledgeBase.deleteMany({ where: { businessId: testBusiness.id } });
    await prisma.business.delete({ where: { id: testBusiness.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should mark responses as knowledgeBaseUsed when KB returns chunks', async () => {
    if (skipIfNoDb()) return;

    // Insert a knowledge base entry and chunk directly
    const kb = await prisma.knowledgeBase.create({ data: { businessId: testBusiness.id, title: 'E2E KB', content: 'Working hours are 9 AM to 5 PM', type: 'TEXT' } });
    const chunk = await prisma.knowledgeChunk.create({ data: { businessId: testBusiness.id, knowledgeBaseId: kb.id, content: 'Working hours are 9 AM to 5 PM' } });

    // Mock vectorSearch to return this chunk
    vectorSearch.searchKnowledge.mockResolvedValue([{ id: chunk.id, content: chunk.content }]);

    // Mock aiService to assert it receives knowledgeBase and return a response
    aiService.generateChatResponse.mockImplementation(async (message, business, history, knowledgeBase, conversationId) => {
      // ensure knowledgeBase passed to AI is non-empty
      const used = Array.isArray(knowledgeBase) && knowledgeBase.length > 0;
      return {
        response: used ? `حسب قاعدة المعرفة: ${knowledgeBase[0].content}` : 'لا توجد معلومات في قاعدة المعرفة',
        tokensUsed: 10,
        model: 'mocked-model',
        knowledgeBaseUsed: used,
        knowledgeBaseCount: knowledgeBase.length
      };
    });

    const res = await request(app)
      .post('/api/chat/message')
      .send({ message: 'What are the working hours?', businessId: testBusiness.id, conversationId: testConversation.id });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('response');
    expect(res.body.knowledgeBaseUsed).toBe(true);
    expect(res.body.knowledgeBaseCount).toBeGreaterThan(0);
    expect(res.body.response).toContain('قاعدة المعرفة');
  });
});
