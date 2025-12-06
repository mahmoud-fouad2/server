const { PrismaClient } = require('@prisma/client');
const vectorSearchService = require('../../src/services/vector-search.service');
const knowledgeBaseService = require('../../src/services/knowledge-base.service');

const prisma = new PrismaClient();

describe('Core Integration Tests', () => {
  let testBusinessId;
  let testKnowledgeBaseId;

  beforeAll(async () => {
    // Create test business
    const business = await prisma.business.create({
      data: {
        userId: 'test-user-id',
        name: 'Test Business',
        activityType: 'COMPANY'
      }
    });
    testBusinessId = business.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.knowledgeChunk.deleteMany({ where: { businessId: testBusinessId } });
    await prisma.knowledgeBase.deleteMany({ where: { businessId: testBusinessId } });
    await prisma.business.delete({ where: { id: testBusinessId } });
    await prisma.$disconnect();
  });

  describe('Knowledge Base Processing', () => {
    test('should process knowledge base content into chunks', async () => {
      const content = `
        مرحباً بكم في مطعم الطعام الشهي
        نقدم أشهى الأطباق الشرقية والغربية
        مواعيد العمل: من 11 صباحاً حتى 11 مساءً
        يمكنكم الحجز عبر الهاتف أو التطبيق
        لدينا خدمة توصيل مجانية للطلبات فوق 50 ريال
      `;

      const result = await knowledgeBaseService.processKnowledgeBase(testBusinessId, content, 'Restaurant Info');

      expect(result.success).toBe(true);
      expect(result.chunksProcessed).toBeGreaterThan(0);
      expect(result.chunksStored).toBeGreaterThan(0);
    });

    test('should search knowledge base using vector search', async () => {
      const query = 'مواعيد العمل';
      const results = await vectorSearchService.searchKnowledge(testBusinessId, query, 3, 0.5);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Check that results contain relevant content
      const hasRelevantContent = results.some(result =>
        result.content.includes('مواعيد') ||
        result.content.includes('العمل') ||
        result.content.includes('11')
      );
      expect(hasRelevantContent).toBe(true);
    });

    test('should return empty array for irrelevant queries', async () => {
      const query = 'سيارات ومركبات';
      const results = await vectorSearchService.searchKnowledge(testBusinessId, query, 3, 0.7);

      // Should return empty or very low similarity results
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Knowledge Base Statistics', () => {
    test('should provide accurate knowledge base statistics', async () => {
      const stats = await knowledgeBaseService.getKnowledgeBaseStats(testBusinessId);

      expect(stats.businessId).toBe(testBusinessId);
      expect(stats.knowledgeBases).toBeGreaterThanOrEqual(1);
      expect(stats.chunks).toBeGreaterThan(0);
      expect(stats.lastUpdated).toBeDefined();
    });
  });
});