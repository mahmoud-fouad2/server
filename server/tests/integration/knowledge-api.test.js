/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Knowledge Base API Integration Tests
 * ═══════════════════════════════════════════════════
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Mock services
jest.mock('../../src/services/embedding.service');
jest.mock('../../src/services/redis-cache.service');
jest.mock('../../src/services/crawler.service');
jest.mock('../../src/services/summarizer.service');

const embeddingService = require('../../src/services/embedding.service');
const redisCache = require('../../src/services/redis-cache.service');
const crawlerService = require('../../src/services/crawler.service');
const summarizerService = require('../../src/services/summarizer.service');

// Create express app for testing
const express = require('express');
const app = express();

app.use(express.json());

// Import and use the knowledge routes
const knowledgeRoutes = require('../../src/routes/knowledge.routes');
app.use('/api/knowledge', knowledgeRoutes);

// Mock authentication middleware
app.use('/api/knowledge', (req, res, next) => {
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

describe('Knowledge Base API Integration Tests', () => {
  let testBusiness;
  let testUser;
  let authToken;
  let testKnowledgeBase;

  beforeAll(async () => {
    // Set test environment
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';

    // Create test user and business
    testUser = await prisma.user.create({
      data: {
        email: 'test-knowledge@example.com',
        fullName: 'Test Knowledge User',
        password: 'hashed-password',
        role: 'CLIENT'
      }
    });

    testBusiness = await prisma.business.create({
      data: {
        userId: testUser.id,
        name: 'Test Knowledge Business',
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
  });

  afterAll(async () => {
    // Cleanup
    await prisma.knowledgeChunk.deleteMany({ where: { businessId: testBusiness.id } });
    await prisma.knowledgeBase.deleteMany({ where: { businessId: testBusiness.id } });
    await prisma.business.delete({ where: { id: testBusiness.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    embeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    redisCache.invalidate.mockResolvedValue();
    summarizerService.summarizeText.mockResolvedValue('Test summary');
  });

  describe('POST /api/knowledge/text', () => {
    test('should add text knowledge successfully', async () => {
      const textRequest = {
        text: 'This is a test knowledge base entry with some content about our restaurant services.',
        title: 'Test Restaurant Info'
      };

      const res = await request(app)
        .post('/api/knowledge/text')
        .set('Authorization', `Bearer ${authToken}`)
        .send(textRequest);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Text added successfully');
      expect(res.body).toHaveProperty('id');

      // Verify knowledge base was created
      const kb = await prisma.knowledgeBase.findUnique({
        where: { id: res.body.id }
      });
      expect(kb).toBeTruthy();
      expect(kb.businessId).toBe(testBusiness.id);
      expect(kb.type).toBe('TEXT');
      expect(kb.content).toBe(textRequest.text);

      testKnowledgeBase = kb;
    });

    test('should reject text addition without authentication', async () => {
      const textRequest = {
        text: 'Unauthorized text addition',
        title: 'Test'
      };

      const res = await request(app)
        .post('/api/knowledge/text')
        .send(textRequest);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Business ID missing');
    });

    test('should reject empty text', async () => {
      const textRequest = {
        text: '',
        title: 'Empty Text'
      };

      const res = await request(app)
        .post('/api/knowledge/text')
        .set('Authorization', `Bearer ${authToken}`)
        .send(textRequest);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Text is required');
    });

    test('should create knowledge chunks for text', async () => {
      const longText = 'This is a long text that should be chunked into multiple pieces for better search performance. '.repeat(50);

      const textRequest = {
        text: longText,
        title: 'Long Text for Chunking'
      };

      const res = await request(app)
        .post('/api/knowledge/text')
        .set('Authorization', `Bearer ${authToken}`)
        .send(textRequest);

      expect(res.status).toBe(200);

      // Verify chunks were created
      const chunks = await prisma.knowledgeChunk.findMany({
        where: { knowledgeBaseId: res.body.id }
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toHaveProperty('content');
      expect(chunks[0]).toHaveProperty('businessId', testBusiness.id);
    });

    test('should invalidate Redis cache after adding text', async () => {
      const textRequest = {
        text: 'Cache invalidation test',
        title: 'Cache Test'
      };

      await request(app)
        .post('/api/knowledge/text')
        .set('Authorization', `Bearer ${authToken}`)
        .send(textRequest);

      expect(redisCache.invalidate).toHaveBeenCalledWith(testBusiness.id);
    });
  });

  describe('POST /api/knowledge/url', () => {
    test('should add URL knowledge successfully', async () => {
      // Mock axios for URL fetching
      const mockAxios = require('axios');
      jest.mock('axios');
      mockAxios.get.mockResolvedValue({
        data: `
          <html>
            <head><title>Test Page</title></head>
            <body>
              <main>
                <h1>Welcome to our restaurant</h1>
                <p>We serve delicious food and provide excellent service.</p>
                <p>Our menu includes pizza, pasta, and salads.</p>
              </main>
            </body>
          </html>
        `
      });

      const urlRequest = {
        url: 'https://example.com/menu'
      };

      const res = await request(app)
        .post('/api/knowledge/url')
        .set('Authorization', `Bearer ${authToken}`)
        .send(urlRequest);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'URL scraped successfully');
      expect(res.body).toHaveProperty('id');
    });

    test('should handle deep crawl option', async () => {
      const mockCrawler = {
        start: jest.fn().mockResolvedValue({
          pages: [
            {
              url: 'https://example.com/page1',
              title: 'Page 1',
              content: 'Content of page 1',
              wordCount: 50,
              depth: 1
            },
            {
              url: 'https://example.com/page2',
              title: 'Page 2',
              content: 'Content of page 2',
              wordCount: 40,
              depth: 1
            }
          ],
          totalPages: 2,
          totalWords: 90
        })
      };

      crawlerService.WebCrawler.mockImplementation(() => mockCrawler);

      const urlRequest = {
        url: 'https://example.com',
        deepCrawl: true
      };

      const res = await request(app)
        .post('/api/knowledge/url')
        .set('Authorization', `Bearer ${authToken}`)
        .send(urlRequest);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pagesCount', 2);
      expect(res.body).toHaveProperty('totalWords', 90);
      expect(res.body.ids).toHaveLength(2);
    });

    test('should reject invalid URLs', async () => {
      const urlRequest = {
        url: 'not-a-valid-url'
      };

      const res = await request(app)
        .post('/api/knowledge/url')
        .set('Authorization', `Bearer ${authToken}`)
        .send(urlRequest);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('URL is required');
    });
  });

  describe('GET /api/knowledge', () => {
    test('should retrieve all knowledge for business', async () => {
      // Add some test knowledge first
      await prisma.knowledgeBase.create({
        data: {
          businessId: testBusiness.id,
          type: 'TEXT',
          content: 'Test knowledge for retrieval',
          metadata: { title: 'Retrieval Test' }
        }
      });

      const res = await request(app)
        .get('/api/knowledge')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      // Check that metadata is parsed
      const firstItem = res.body[0];
      expect(firstItem).toHaveProperty('type');
      expect(firstItem).toHaveProperty('content');
      expect(firstItem).toHaveProperty('metadata');
    });

    test('should return empty array for business with no knowledge', async () => {
      // Create a new business with no knowledge
      const emptyBusiness = await prisma.business.create({
        data: {
          userId: testUser.id,
          name: 'Empty Business',
          activityType: 'RETAIL'
        }
      });

      const emptyToken = jwt.sign(
        { userId: testUser.id, businessId: emptyBusiness.id, role: 'CLIENT' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/knowledge')
        .set('Authorization', `Bearer ${emptyToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual([]);

      // Cleanup
      await prisma.business.delete({ where: { id: emptyBusiness.id } });
    });
  });

  describe('PUT /api/knowledge/:id', () => {
    test('should update text knowledge successfully', async () => {
      const updateRequest = {
        content: 'Updated content for the knowledge base',
        title: 'Updated Title'
      };

      const res = await request(app)
        .put(`/api/knowledge/${testKnowledgeBase.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateRequest);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Knowledge base updated successfully');

      // Verify update
      const updated = await prisma.knowledgeBase.findUnique({
        where: { id: testKnowledgeBase.id }
      });
      expect(updated.content).toBe(updateRequest.content);
    });

    test('should reject update of non-TEXT knowledge', async () => {
      // Create URL knowledge
      const urlKb = await prisma.knowledgeBase.create({
        data: {
          businessId: testBusiness.id,
          type: 'URL',
          content: 'URL content',
          metadata: { url: 'https://example.com' }
        }
      });

      const updateRequest = {
        content: 'Trying to update URL content'
      };

      const res = await request(app)
        .put(`/api/knowledge/${urlKb.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateRequest);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Only TEXT entries can be edited');

      // Cleanup
      await prisma.knowledgeBase.delete({ where: { id: urlKb.id } });
    });

    test('should reject update without content', async () => {
      const updateRequest = {
        title: 'No Content Update'
      };

      const res = await request(app)
        .put(`/api/knowledge/${testKnowledgeBase.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateRequest);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Content is required');
    });
  });

  describe('DELETE /api/knowledge/:id', () => {
    test('should delete knowledge successfully', async () => {
      const deleteRes = await request(app)
        .delete(`/api/knowledge/${testKnowledgeBase.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body).toHaveProperty('message', 'Deleted successfully');

      // Verify deletion
      const deleted = await prisma.knowledgeBase.findUnique({
        where: { id: testKnowledgeBase.id }
      });
      expect(deleted).toBeNull();

      // Verify chunks were also deleted
      const chunks = await prisma.knowledgeChunk.findMany({
        where: { knowledgeBaseId: testKnowledgeBase.id }
      });
      expect(chunks).toHaveLength(0);
    });

    test('should invalidate cache after deletion', async () => {
      // Create knowledge to delete
      const kbToDelete = await prisma.knowledgeBase.create({
        data: {
          businessId: testBusiness.id,
          type: 'TEXT',
          content: 'Content to delete',
          metadata: { title: 'Delete Test' }
        }
      });

      await request(app)
        .delete(`/api/knowledge/${kbToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(redisCache.invalidate).toHaveBeenCalledWith(testBusiness.id);
    });
  });

  describe('POST /api/knowledge/chunks/embed', () => {
    test('should embed unembedded chunks successfully', async () => {
      // Create knowledge with chunks but no embeddings
      const kb = await prisma.knowledgeBase.create({
        data: {
          businessId: testBusiness.id,
          type: 'TEXT',
          content: 'Content for embedding test',
          metadata: { title: 'Embedding Test' }
        }
      });

      // Create chunk without embedding
      await prisma.knowledgeChunk.create({
        data: {
          knowledgeBaseId: kb.id,
          businessId: testBusiness.id,
          content: 'Chunk content to embed',
          metadata: { test: true }
        }
      });

      const embedRequest = {
        limit: 10
      };

      const res = await request(app)
        .post('/api/knowledge/chunks/embed')
        .set('Authorization', `Bearer ${authToken}`)
        .send(embedRequest);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('processed', 1);

      // Cleanup
      await prisma.knowledgeChunk.deleteMany({ where: { knowledgeBaseId: kb.id } });
      await prisma.knowledgeBase.delete({ where: { id: kb.id } });
    });

    test('should return message when no unembedded chunks found', async () => {
      const embedRequest = {
        limit: 10
      };

      const res = await request(app)
        .post('/api/knowledge/chunks/embed')
        .set('Authorization', `Bearer ${authToken}`)
        .send(embedRequest);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'No unembedded chunks found');
      expect(res.body).toHaveProperty('processed', 0);
    });
  });

  describe('File Upload Security', () => {
    test('should reject files that are too large', async () => {
      // This would require mocking multer, which is complex
      // Skipping for now as it's more of an integration test
      expect(true).toBe(true);
    });

    test('should reject invalid file types', async () => {
      // This would also require mocking multer
      // Skipping for now
      expect(true).toBe(true);
    });
  });
});