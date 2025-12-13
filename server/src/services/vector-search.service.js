const prisma = require('../config/database');
const embeddingService = require('./embedding.service');
const logger = require('../utils/logger');

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'with', 'from', 'this', 'that', 'have', 'has',
  'you', 'your', 'about', 'into', 'onto', 'over', 'under', 'than', 'then',
  'them', 'was', 'were', 'will', 'shall', 'would', 'could'
]);

/**
 * Vector Search Service
 * Implements semantic search using pgvector extension
 * 
 * Features:
 * - Cosine similarity search for relevant knowledge chunks
 * - Fallback to keyword search if vector search fails
 * - Caching support for repeated queries
 */

class VectorSearchService {
  /**
   * Search for relevant knowledge chunks using vector similarity
   * 
   * @param {string} query - User's question/message
   * @param {string} businessId - Business ID to filter results
   * @param {number} limit - Maximum number of results (default: 5)
   * @returns {Promise<Array>} - Array of relevant knowledge chunks
   */
  async searchKnowledge(query, businessId, limit = 5) {
    const originalQuery = query;
    try {
      // Step 1: Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0 || !queryEmbedding.every(n => typeof n === 'number' && Number.isFinite(n))) {
        logger.warn('Vector search: failed to generate query embedding, using keyword fallback', { businessId });
        return await this.fallbackKeywordSearch(query, businessId, limit);
      }

      // Step 2: Perform vector similarity search using raw SQL
      // Note: Prisma doesn't support vector operations natively yet
      const limitValue = Math.max(1, Math.min(Number(limit) || 5, 50));
      const embeddingVector = queryEmbedding.map(num => Number.isFinite(num) ? Number(num) : 0);
      const embeddingLiteral = `'[${embeddingVector.join(',')}]'::vector`;
      const sanitizedBusinessId = String(businessId || '').replace(/'/g, "''");
      const sql = `
        SELECT 
          id,
          "knowledgeBaseId",
          "businessId",
          content,
          metadata,
          "createdAt",
          1 - (embedding_vector <=> ${embeddingLiteral}) as similarity
          FROM "KnowledgeChunk"
          WHERE "businessId" = '${sanitizedBusinessId}'
            AND embedding_vector IS NOT NULL
          ORDER BY embedding_vector <=> ${embeddingLiteral}
        LIMIT ${limitValue}
      `;
      const rawExecutor = prisma.$queryRaw
        ? prisma.$queryRaw.bind(prisma)
        : prisma.$queryRawUnsafe
          ? prisma.$queryRawUnsafe.bind(prisma)
          : null;

      if (!rawExecutor) {
        throw new Error('Prisma client does not expose a raw query executor');
      }
      const results = await rawExecutor(sql);

      // Step 3: Filter results by similarity threshold (0.7 = 70% similar)
      const filteredResults = results.filter(r => r.similarity >= 0.7);

      if (filteredResults.length === 0) {
        logger.debug('Vector search: no high-similarity results, using keyword fallback', { businessId });
        return await this.fallbackKeywordSearch(originalQuery, businessId, limit);
      }

      logger.debug('Vector search completed', { businessId, resultsCount: filteredResults.length, threshold: 0.7 });
      return filteredResults.slice(0, limitValue);

    } catch (error) {
      const msg = error && (error.message || error.toString());
      // If pgvector is not installed or query fails, fall back to keyword search
      if ((msg && msg.includes('vector')) || error?.code === '42883') {
        logger.warn('Vector search: pgvector extension not available, using keyword fallback', { businessId, error: msg });
        return await this.fallbackKeywordSearch(originalQuery, businessId, limit);
      }

      console.error('[VectorSearch] Error:', msg || error);
      throw error;
    }
  }

  /**
   * Fallback keyword search when vector search is unavailable
   * Uses PostgreSQL full-text search
   * 
   * @param {string} query - Search query
   * @param {string} businessId - Business ID
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} - Matching knowledge chunks
   */
  async fallbackKeywordSearch(query, businessId, limit = 5) {
    try {
      // Simple keyword matching with case-insensitive search
      const keywords = query
        .toLowerCase()
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
      
      const results = await prisma.knowledgeChunk.findMany({
        where: {
          businessId,
          content: {
            contains: keywords[0] || query, // At least match the first keyword
            mode: 'insensitive'
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      logger.debug('Keyword search completed', { businessId, resultsCount: results.length });
      return results;

    } catch (error) {
      logger.error('Keyword search failed', { businessId, error: error.message });
      return []; // Return empty array on error
    }
  }

  /**
   * Check if pgvector extension is available
   * 
   * @returns {Promise<boolean>} - True if pgvector is installed
   */
  async isPgVectorAvailable() {
    // Allow forcing pgvector availability via environment (useful for managed DBs where
    // extension check may be restricted or in CI environments)
    if (process.env.FORCE_PGVECTOR === 'true') {
      return true;
    }

    try {
      // Try to query pg_available_extensions first (works in managed DBs)
      const rawExecutor = prisma.$queryRaw
        ? prisma.$queryRaw.bind(prisma)
        : prisma.$queryRawUnsafe
          ? prisma.$queryRawUnsafe.bind(prisma)
          : null;

      if (!rawExecutor) {
        throw new Error('Prisma client does not expose a raw query executor');
      }
      
      // Check if vector extension exists (installed or available)
      const result = await rawExecutor(`
        SELECT EXISTS (
          SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
        ) as available
      `);
      
      const isAvailable = result[0]?.available || false;
      
      // If available, try to create it if not already created
      if (isAvailable) {
        try {
          await rawExecutor`CREATE EXTENSION IF NOT EXISTS vector`;
        } catch (createError) {
          logger.debug('pgvector extension already exists or cannot be created', { error: createError.message });
        }
      }
      
      return isAvailable;
    } catch (error) {
      logger.error('Failed to check pgvector availability', { error: error.message || error });
      return false;
    }
  }

  /**
   * Generate embedding for text using the embedding service
   * @param {string} text - Text to embed
   * @returns {Promise<Array>} - Embedding vector
   */
  async generateEmbedding(text) {
    return await embeddingService.generateEmbedding(text);
  }

  /**
   * Get statistics about vector search performance
   *
   * @param {string} businessId - Business ID
   * @returns {Promise<Object>} - Stats object
   */
  async getSearchStats(businessId) {
    try {
      const totalChunks = await prisma.knowledgeChunk.count({
        where: { businessId }
      });

      const chunksWithEmbeddings = await prisma.knowledgeChunk.count({
        where: {
          businessId,
          // count by vector column when available
          OR: [
            { embedding: { not: null } },
            { embedding_vector: { not: null } }
          ]
        }
      });

      const coverage = totalChunks > 0
        ? ((chunksWithEmbeddings / totalChunks) * 100).toFixed(2)
        : 0;

      return {
        totalChunks,
        chunksWithEmbeddings,
        coveragePercentage: parseFloat(coverage),
        isPgVectorAvailable: await this.isPgVectorAvailable()
      };
    } catch (error) {
      logger.error('Failed to get vector search statistics', { businessId, error: error.message });
      return null;
    }
  }
}

module.exports = new VectorSearchService();
