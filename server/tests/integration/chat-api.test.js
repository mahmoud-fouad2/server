/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Chat API Integration Tests
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

// Mock the app and its dependencies
jest.mock('../../src/services/cache.service');
jest.mock('../../src/services/visitor-session.service');
jest.mock('../../src/services/vector-search.service');
jest.mock('../../src/services/groq.service');
jest.mock('../../src/services/response-validator.service');

const redisCache = require('../../src/services/cache.service');
const visitorSession = require('../../src/services/visitor-session.service');
const vectorSearch = require('../../src/services/vector-search.service');
const groqService = require('../../src/services/groq.service');
const responseValidator = require('../../src/services/response-validator.service');

// Create express app for testing
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Import and use the chat routes
const chatRoutes = require('../../src/routes/chat.routes');
app.use('/api/chat', chatRoutes);

// Mock authentication middleware for testing
app.use('/api/chat', (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    } catch (e) {
      // Ignore invalid tokens in tests
    }
  }
  next();
});

describe('Chat API Integration Tests', () => {
  let testBusiness;
  let testUser;
  let authToken;
  let testConversation;

  beforeAll(async () => {
    // Set test environment
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbAvailable = false;
      dbErrorMessage = error?.message || 'Database unavailable';
      console.warn('[Chat API Integration Tests] Database unavailable:', dbErrorMessage);
      return;
    }

    // Create test user and business
    testUser = await prisma.user.create({
      data: {
        email: 'test-chat@example.com',
        fullName: 'Test Chat User',
        password: 'hashed-password',
        role: 'CLIENT'
      }
    });

    testBusiness = await prisma.business.create({
      data: {
        userId: testUser.id,
        name: 'Test Chat Business',
        activityType: 'RETAIL',
        planType: 'TRIAL',
        messageQuota: 1000,
        messagesUsed: 0,
        language: 'ar'
      }
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, businessId: testBusiness.id, role: 'CLIENT' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test conversation
    testConversation = await prisma.conversation.create({
      data: {
        businessId: testBusiness.id,
        channel: 'WIDGET',
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    if (!dbAvailable) {
      await prisma.$disconnect().catch(() => {});
      return;
    }

    // Cleanup
    await prisma.message.deleteMany({ where: { conversationId: testConversation.id } });
    await prisma.conversation.deleteMany({ where: { businessId: testBusiness.id } });
    await prisma.business.delete({ where: { id: testBusiness.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    redisCache.get.mockResolvedValue(null); // No cached response
    visitorSession.getOrCreateSession.mockResolvedValue({
      id: 'session-123',
      detectedDialect: 'standard'
    });
    vectorSearch.searchKnowledge.mockResolvedValue([]);
    groqService.generateChatResponse.mockResolvedValue({
      response: 'Test AI response',
      tokensUsed: 50,
      model: 'test-model'
    });
    responseValidator.validateResponse.mockReturnValue({
      isValid: true,
      issues: []
    });
  });

  describe('GET /api/chat/conversations', () => {
    runIfDbAvailable('should return conversations for authenticated business', async () => {
      const res = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    runIfDbAvailable('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .get('/api/chat/conversations');

      expect(res.status).toBe(401);
    });

    runIfDbAvailable('should reject requests without business ID', async () => {
      const tokenWithoutBusiness = jwt.sign(
        { userId: testUser.id, role: 'CLIENT' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${tokenWithoutBusiness}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Business ID required');
    });
  });

  describe('GET /api/chat/:conversationId/messages', () => {
    runIfDbAvailable('should return messages for conversation', async () => {
      // Add a test message
      await prisma.message.create({
        data: {
          conversationId: testConversation.id,
          role: 'USER',
          content: 'Test message'
        }
      });

      const res = await request(app)
        .get(`/api/chat/${testConversation.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('content', 'Test message');
    });

    runIfDbAvailable('should return empty array for conversation with no messages', async () => {
      const emptyConversation = await prisma.conversation.create({
        data: {
          businessId: testBusiness.id,
          channel: 'WIDGET',
          status: 'ACTIVE'
        }
      });

      const res = await request(app)
        .get(`/api/chat/${emptyConversation.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);

      // Cleanup
      await prisma.conversation.delete({ where: { id: emptyConversation.id } });
    });
  });

  describe('POST /api/chat/message (Public Chat Endpoint)', () => {
    runIfDbAvailable('should process chat message successfully', async () => {
      const chatRequest = {
        message: 'Hello, how can I help you?',
        businessId: testBusiness.id,
        conversationId: testConversation.id,
        sessionId: 'session-123'
      };

      const res = await request(app)
        .post('/api/chat/message')
        .send(chatRequest);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('response', 'Test AI response');
      expect(res.body).toHaveProperty('conversationId', testConversation.id);
      expect(res.body).toHaveProperty('fromCache', false);
      expect(res.body).toHaveProperty('tokensUsed', 50);
    });

    runIfDbAvailable('should create new conversation if conversationId not provided', async () => {
      const chatRequest = {
        message: 'New conversation message',
        businessId: testBusiness.id,
        sessionId: 'session-456'
      };

      const res = await request(app)
        .post('/api/chat/message')
        .send(chatRequest);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('conversationId');
      expect(res.body.conversationId).not.toBe(testConversation.id); // Should be new

      // Verify conversation was created
      const newConversation = await prisma.conversation.findUnique({
        where: { id: res.body.conversationId }
      });
      expect(newConversation).toBeTruthy();
      expect(newConversation.businessId).toBe(testBusiness.id);

      // Cleanup
      await prisma.message.deleteMany({ where: { conversationId: res.body.conversationId } });
      await prisma.conversation.delete({ where: { id: res.body.conversationId } });
    });

    runIfDbAvailable('should reject message without required fields', async () => {
      const res = await request(app)
        .post('/api/chat/message')
        .send({ message: 'Test' }); // Missing businessId

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Business ID are required');
    });

    runIfDbAvailable('should use cached response when available', async () => {
      const cachedResponse = {
        response: 'Cached response',
        tokensUsed: 0
      };

      redisCache.get.mockResolvedValue({ response: cachedResponse });

      const chatRequest = {
        message: 'Cached message',
        businessId: testBusiness.id,
        conversationId: testConversation.id
      };

      const res = await request(app)
        .post('/api/chat/message')
        .send(chatRequest);

      expect(res.status).toBe(200);
      expect(res.body.response).toBe('Cached response');
      expect(res.body.fromCache).toBe(true);
      expect(res.body.tokensUsed).toBe(0);
      expect(redisCache.get).toHaveBeenCalledWith(testBusiness.id, 'Cached message');
    });

    runIfDbAvailable('should handle handover requests', async () => {
      const handoverRequest = {
        message: 'I need to speak to an agent',
        businessId: testBusiness.id,
        conversationId: testConversation.id
      };

      const res = await request(app)
        .post('/api/chat/message')
        .send(handoverRequest);

      expect(res.status).toBe(200);
      expect(res.body.action).toBe('ask_details');
      expect(res.body.response).toContain('الاسم وملخص المشكلة');
    });

    runIfDbAvailable('should complete handover when user provides details', async () => {
      // First, set up handover request state
      await prisma.message.create({
        data: {
          conversationId: testConversation.id,
          role: 'ASSISTANT',
          content: 'لتحويلك للموظف المختص، يرجى تزويدي بـ: الاسم وملخص المشكلة.'
        }
      });

      const handoverDetails = {
        message: 'My name is John and I need help with my order',
        businessId: testBusiness.id,
        conversationId: testConversation.id
      };

      const res = await request(app)
        .post('/api/chat/message')
        .send(handoverDetails);

      expect(res.status).toBe(200);
      expect(res.body.action).toBe('handover_complete');
      expect(res.body.response).toContain('شكراً لك');
    });

    runIfDbAvailable('should increment business message usage', async () => {
      const initialUsage = testBusiness.messagesUsed;

      const chatRequest = {
        message: 'Test usage increment',
        businessId: testBusiness.id,
        conversationId: testConversation.id
      };

      await request(app)
        .post('/api/chat/message')
        .send(chatRequest);

      // Verify usage was incremented
      const updatedBusiness = await prisma.business.findUnique({
        where: { id: testBusiness.id }
      });
      expect(updatedBusiness.messagesUsed).toBe(initialUsage + 1);
    });

    runIfDbAvailable('should handle AI service errors gracefully', async () => {
      groqService.generateChatResponse.mockRejectedValue(new Error('AI service error'));

      const chatRequest = {
        message: 'This will cause AI error',
        businessId: testBusiness.id,
        conversationId: testConversation.id
      };

      const res = await request(app)
        .post('/api/chat/message')
        .send(chatRequest);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('error', 'AI_ERROR');
      expect(res.body.response).toBeDefined(); // Should have fallback response
    });

    runIfDbAvailable('should call vector search with correct parameters', async () => {
      const chatRequest = {
        message: 'Search for knowledge',
        businessId: testBusiness.id,
        conversationId: testConversation.id
      };

      await request(app)
        .post('/api/chat/message')
        .send(chatRequest);

      expect(vectorSearch.searchKnowledge).toHaveBeenCalledWith(
        'Search for knowledge',
        testBusiness.id,
        3 // Limit parameter
      );
    });

    runIfDbAvailable('should validate AI response', async () => {
      const chatRequest = {
        message: 'Validate this response',
        businessId: testBusiness.id,
        conversationId: testConversation.id
      };

      await request(app)
        .post('/api/chat/message')
        .send(chatRequest);

      expect(responseValidator.validateResponse).toHaveBeenCalledWith(
        'Test AI response',
        expect.objectContaining({
          isFirstMessage: false,
          expectArabic: true,
          businessType: 'RETAIL'
        })
      );
    });
  });

  describe('POST /api/chat/rating', () => {
    runIfDbAvailable('should submit rating successfully', async () => {
      const ratingRequest = {
        conversationId: testConversation.id,
        rating: 5,
        feedback: 'Great service!'
      };

      const res = await request(app)
        .post('/api/chat/rating')
        .send(ratingRequest);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);

      // Verify rating was saved
      const updatedConversation = await prisma.conversation.findUnique({
        where: { id: testConversation.id }
      });
      expect(updatedConversation.rating).toBe(5);
      expect(updatedConversation.feedback).toBe('Great service!');
      expect(updatedConversation.status).toBe('CLOSED');
    });

    runIfDbAvailable('should reject rating without required fields', async () => {
      const res = await request(app)
        .post('/api/chat/rating')
        .send({ feedback: 'Test' }); // Missing conversationId and rating

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Conversation ID and rating are required');
    });

    runIfDbAvailable('should handle invalid conversation ID', async () => {
      const ratingRequest = {
        conversationId: 'invalid-id',
        rating: 4
      };

      const res = await request(app)
        .post('/api/chat/rating')
        .send(ratingRequest);

      expect(res.status).toBe(500); // Should handle gracefully
    });
  });

  describe('POST /api/chat/reply (Agent Reply)', () => {
    runIfDbAvailable('should allow agent to reply to conversation', async () => {
      const replyRequest = {
        conversationId: testConversation.id,
        message: 'Agent response to customer'
      };

      const res = await request(app)
        .post('/api/chat/reply')
        .set('Authorization', `Bearer ${authToken}`)
        .send(replyRequest);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('content', 'Agent response to customer');
      expect(res.body).toHaveProperty('role', 'ASSISTANT');

      // Verify conversation was updated
      const updatedConversation = await prisma.conversation.findUnique({
        where: { id: testConversation.id }
      });
      expect(updatedConversation.status).toBe('AGENT_ACTIVE');
      expect(updatedConversation.updatedAt.getTime()).toBeGreaterThan(testConversation.updatedAt.getTime());
    });

    runIfDbAvailable('should reject agent reply without authentication', async () => {
      const replyRequest = {
        conversationId: testConversation.id,
        message: 'Unauthorized reply'
      };

      const res = await request(app)
        .post('/api/chat/reply')
        .send(replyRequest);

      expect(res.status).toBe(401);
    });
  });
});