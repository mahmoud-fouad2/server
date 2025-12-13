/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Vector Search Service Unit Tests
 * ═══════════════════════════════════════════════════
 */

const vectorSearch = require('../../src/services/vector-search.service');
const embeddingService = require('../../src/services/embedding.service');

// Mock dependencies
jest.mock('../../src/services/embedding.service');
jest.mock('../../src/config/database');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Vector Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchKnowledge', () => {
    test('should perform vector search successfully', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockResults = [
        {
          id: 'chunk-1',
          knowledgeBaseId: 'kb-1',
          businessId: 'business-123',
          content: 'Test content',
          metadata: { page: 1 },
          createdAt: new Date(),
          similarity: 0.85
        }
      ];

      embeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      prisma.$queryRaw.mockResolvedValue(mockResults);

      const result = await vectorSearch.searchKnowledge('test query', 'business-123', 5);

      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith('test query');
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'chunk-1',
        knowledgeBaseId: 'kb-1',
        businessId: 'business-123',
        content: 'Test content',
        similarity: 0.85
      }));
      expect(typeof result[0].combinedScore).toBe('number');
    });

    test('should filter results by similarity threshold', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockResults = [
        {
          id: 'chunk-1',
          knowledgeBaseId: 'kb-1',
          businessId: 'business-123',
          content: 'High similarity content',
          similarity: 0.85
        },
        {
          id: 'chunk-2',
          knowledgeBaseId: 'kb-1',
          businessId: 'business-123',
          content: 'Low similarity content',
          similarity: 0.65
        }
      ];

      embeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      prisma.$queryRaw.mockResolvedValue(mockResults);

      const result = await vectorSearch.searchKnowledge('test query', 'business-123', 5);

      expect(result).toHaveLength(1);
      expect(result[0].similarity).toBe(0.85);
      expect(result[0].content).toBe('High similarity content');
    });

    test('should fallback to keyword search when embedding fails', async () => {
      embeddingService.generateEmbedding.mockResolvedValue(null);

      const mockKeywordResults = [
        {
          id: 'chunk-1',
          knowledgeBaseId: 'kb-1',
          businessId: 'business-123',
          content: 'Keyword match content including test',
          metadata: null,
          matchScore: 1,
          createdAt: new Date()
        }
      ];

      prisma.knowledgeChunk.findMany.mockResolvedValue(mockKeywordResults);

      const result = await vectorSearch.searchKnowledge('test query', 'business-123', 5);

      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith('test query');
      expect(prisma.knowledgeChunk.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockKeywordResults);
    });

    test('should fallback to keyword search when vector search fails', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      embeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);

      // Simulate pgvector not available
      prisma.$queryRaw.mockRejectedValue(new Error('function <=> (vector, vector) does not exist'));

      const mockKeywordResults = [
        {
          id: 'chunk-1',
          knowledgeBaseId: 'kb-1',
          businessId: 'business-123',
          content: 'Fallback content with test keyword',
          metadata: null,
          matchScore: 1,
          createdAt: new Date()
        }
      ];

      prisma.knowledgeChunk.findMany.mockResolvedValue(mockKeywordResults);

      const result = await vectorSearch.searchKnowledge('test query', 'business-123', 5);

      expect(result).toEqual(mockKeywordResults);
    });

    test('should handle empty results and fallback to keyword search', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      embeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);

      // Return results below similarity threshold
      const mockResults = [
        {
          id: 'chunk-1',
          similarity: 0.5 // Below 0.7 threshold
        }
      ];

      prisma.$queryRaw.mockResolvedValue(mockResults);
      prisma.knowledgeChunk.findMany.mockResolvedValue([]);

      const result = await vectorSearch.searchKnowledge('test query', 'business-123', 5);

      expect(result).toEqual([]);
    });

    test('should respect limit parameter', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockResults = Array.from({ length: 10 }, (_, i) => ({
        id: `chunk-${i}`,
        knowledgeBaseId: 'kb-1',
        businessId: 'business-123',
        content: `Content ${i}`,
        similarity: 0.8 + (i * 0.01)
      }));

      embeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      prisma.$queryRaw.mockResolvedValue(mockResults);

      const result = await vectorSearch.searchKnowledge('test query', 'business-123', 3);

      expect(result).toHaveLength(3);
      // The limit is passed as the last parameter to the template call; ensure it's 3
      const lastArg = prisma.$queryRaw.mock.calls[0][prisma.$queryRaw.mock.calls[0].length - 1];
      expect(lastArg).toBe(3);
    });
  });

  describe('fallbackKeywordSearch', () => {
    test('should perform keyword search correctly', async () => {
      const mockResults = [
        {
          id: 'chunk-1',
          knowledgeBaseId: 'kb-1',
          businessId: 'business-123',
          content: 'This contains the keyword test',
          metadata: null,
          matchScore: 1,
          createdAt: new Date()
        }
      ];

      prisma.knowledgeChunk.findMany.mockResolvedValue(mockResults);

      const result = await vectorSearch.fallbackKeywordSearch('test query', 'business-123', 5);

      expect(prisma.knowledgeChunk.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { content: { contains: 'test', mode: 'insensitive' } },
            { content: { contains: 'query', mode: 'insensitive' } }
          ],
          businessId: 'business-123'
        },
        orderBy: { createdAt: 'desc' },
        take: 10 // We fetch more results then filter down to limit
      });

      expect(result).toEqual(mockResults);
    });

    test('should handle short keywords', async () => {
      const mockResults = [
        {
          id: 'chunk-1',
          content: 'Short word content',
          createdAt: new Date()
        }
      ];

      prisma.knowledgeChunk.findMany.mockResolvedValue(mockResults);

      // Query with short words that get filtered out
      const result = await vectorSearch.fallbackKeywordSearch('a an the', 'business-123', 5);

      // Short words are removed; fallback should return recent knowledgeBase entries
      expect(prisma.knowledgeBase.findMany).toHaveBeenCalledWith({
        where: { businessId: 'business-123' },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
    });

    test('should return empty array on error', async () => {
      prisma.knowledgeChunk.findMany.mockRejectedValue(new Error('Database error'));

      const result = await vectorSearch.fallbackKeywordSearch('test query', 'business-123', 5);

      expect(result).toEqual([]);
    });
  });

  describe('isPgVectorAvailable', () => {
    test('should return true when pgvector is available', async () => {
      prisma.$queryRaw.mockResolvedValue([{ available: true }]);

      const result = await vectorSearch.isPgVectorAvailable();

      expect(result).toBe(true);
      // The SQL query is passed as the first element of the template literal parts
      expect(prisma.$queryRaw.mock.calls[0][0][0]).toEqual(expect.stringContaining("SELECT EXISTS"));
    });

    test('should return false when pgvector is not available', async () => {
      prisma.$queryRaw.mockResolvedValue([{ available: false }]);

      const result = await vectorSearch.isPgVectorAvailable();

      expect(result).toBe(false);
    });

    test('should return false on error', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection error'));

      const result = await vectorSearch.isPgVectorAvailable();

      expect(result).toBe(false);
    });
  });

  describe('getSearchStats', () => {
    test('should return correct statistics', async () => {
      prisma.knowledgeChunk.count
        .mockResolvedValueOnce(100) // total chunks
        .mockResolvedValueOnce(80); // chunks with embeddings

      const result = await vectorSearch.getSearchStats('business-123');

      expect(result.totalChunks).toBe(100);
      expect(result.chunksWithEmbeddings).toBe(80);
      expect(result.coveragePercentage).toBe(80);
      expect(result.isPgVectorAvailable).toBeDefined();
    });

    test('should handle zero chunks correctly', async () => {
      prisma.knowledgeChunk.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await vectorSearch.getSearchStats('business-123');

      expect(result.totalChunks).toBe(0);
      expect(result.chunksWithEmbeddings).toBe(0);
      expect(result.coveragePercentage).toBe(0);
    });

    test('should return null on error', async () => {
      prisma.knowledgeChunk.count.mockRejectedValue(new Error('Database error'));

      const result = await vectorSearch.getSearchStats('business-123');

      expect(result).toBeNull();
    });
  });
});