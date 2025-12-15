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
  async searchKnowledge(query, businessId, limit = 5, threshold = null) {
    const originalQuery = query;
    // Skip embedding generation in tests only when explicitly requested
    if (process.env.NODE_ENV === 'test' && process.env.FAKE_VECTOR === 'true') return [];
    try {
      // Step 1: Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0 || !queryEmbedding.every(n => typeof n === 'number' && Number.isFinite(n))) {
        logger.warn('Vector search: failed to generate query embedding, using keyword fallback', { businessId });
        return await this.fallbackKeywordSearch(query, businessId, limit);
      }

      // Step 2: Perform vector similarity search using parameterized query
      // Note: Prisma doesn't support vector operations natively yet, but we use Prisma.$queryRaw with template literals for safety
      const limitValue = Math.max(1, Math.min(Number(limit) || 5, 50));
      const embeddingVector = queryEmbedding.map(num => Number.isFinite(num) ? Number(num) : 0);
      
      // Use Prisma's parameterized query to prevent SQL injection
      // Convert embedding array to PostgreSQL vector format
      const embeddingArray = `[${embeddingVector.join(',')}]`;
      
      // Use Prisma.$queryRaw with template literal for parameterized query
      const results = await prisma.$queryRaw`
        SELECT 
          id,
          "knowledgeBaseId",
          "businessId",
          content,
          metadata,
          "createdAt",
          1 - (embedding_vector <=> ${embeddingArray}::vector) as similarity
        FROM "KnowledgeChunk"
        WHERE "businessId" = ${businessId}
          AND embedding_vector IS NOT NULL
        ORDER BY embedding_vector <=> ${embeddingArray}::vector
        LIMIT ${limitValue}
      `;

      // Step 3: Filter results by similarity threshold (0.7 = 70% similar for quality results)
      // Higher threshold ensures more relevant results
      // Allow per-call threshold override, fall back to env variable, then default
      const thresholdParamValue = threshold !== null ? Number(threshold) : parseFloat(process.env.VECTOR_SIMILARITY_THRESHOLD || '0.7');
      const resolvedThreshold = Number.isFinite(thresholdParamValue) ? thresholdParamValue : 0.7;
      const filteredResults = results.filter(r => (r.similarity || 0) >= resolvedThreshold);

      if (filteredResults.length === 0) {
        logger.debug('Vector search: no results above threshold, using keyword fallback', { 
          businessId, 
          threshold: resolvedThreshold,
          queryLength: originalQuery.length 
        });
        return await this.fallbackKeywordSearch(originalQuery, businessId, limit);
      }

      // Step 4: Rerank by similarity + recency (newer chunks might be more relevant)
      const now = Date.now();
      const rerankedResults = filteredResults
        .map(chunk => {
          const chunkAge = chunk.createdAt ? (now - new Date(chunk.createdAt).getTime()) : Infinity;
          const recencyScore = Math.max(0, 1 - (chunkAge / (30 * 24 * 60 * 60 * 1000))); // 30 days max
          const combinedScore = (chunk.similarity || 0) * 0.8 + recencyScore * 0.2; // 80% similarity, 20% recency
          return { ...chunk, combinedScore };
        })
        .sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0))
        .slice(0, Math.min(limitValue, 3)); // Limit to top 3 for better quality

      logger.debug('Vector search completed', { 
        businessId, 
        resultsCount: rerankedResults.length, 
        threshold: resolvedThreshold,
        topSimilarity: rerankedResults[0]?.similarity,
        topScore: rerankedResults[0]?.combinedScore
      });
      
      return rerankedResults;

    } catch (error) {
      const msg = error && (error.message || error.toString());
      // If pgvector is not installed or query fails, fall back to keyword search
      if ((msg && msg.includes('vector')) || error?.code === '42883') {
        logger.warn('Vector search: pgvector extension not available, using keyword fallback', { businessId, error: msg });
        return await this.fallbackKeywordSearch(originalQuery, businessId, limit);
      }

      logger.error('[VectorSearch] Error:', { error: msg || error, businessId });
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
      // Enhanced keyword matching - extract meaningful keywords
      const keywords = query
        .toLowerCase()
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
      
      if (keywords.length === 0) {
        // If no keywords, return recent knowledge base entries
        const recentKnowledge = await prisma.knowledgeBase.findMany({
          where: { businessId },
          orderBy: { createdAt: 'desc' },
          take: limit
        });
        return recentKnowledge.map(kb => ({
          id: kb.id,
          businessId: kb.businessId,
          content: kb.content,
          metadata: kb.metadata
        }));
      }

      // Try to find chunks containing any of the keywords
      const results = await prisma.knowledgeChunk.findMany({
        where: {
          businessId,
          OR: keywords.map(keyword => ({
            content: {
              contains: keyword,
              mode: 'insensitive'
            }
          }))
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit * 2 // Get more results to filter
      });

      // Score results by number of matching keywords
      const scoredResults = results.map(chunk => {
        const contentLower = chunk.content.toLowerCase();
        const matchCount = keywords.filter(kw => contentLower.includes(kw)).length;
        return { ...chunk, matchScore: matchCount };
      })
      .filter(chunk => chunk.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

      // If a rerank model is configured, attempt to rerank using an LLM scoring model
      try {
        const { rerankCandidates } = require('./rerank.service');
        const reranked = await rerankCandidates(query, scoredResults);
        return reranked;
      } catch (e) {
        // If rerank fails, return scored results
        return scoredResults;
      }

      logger.debug('Keyword search completed', { 
        businessId, 
        resultsCount: scoredResults.length,
        keywords: keywords.length 
      });
      
      return scoredResults;

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
      // Use Prisma.$queryRaw with template literal for safety
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
        ) as available
      `;
      
      const isAvailable = result[0]?.available || false;
      
      // If available, try to create it if not already created
      if (isAvailable) {
        try {
          await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
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
