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
    
    // Temporarily disable vector search due to pgvector issues, use keyword fallback
    logger.info('Vector search disabled, using keyword fallback', { businessId });
    return await this.fallbackKeywordSearch(query, businessId, limit);
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

      logger.debug('Keyword search completed (pre-rerank)', { businessId, resultsCount: scoredResults.length, keywords: keywords.length });
      // If a rerank model is configured, attempt to rerank using an LLM scoring model
      try {
        const { rerankCandidates } = require('./rerank.service');
        const reranked = await rerankCandidates(query, scoredResults);
        return reranked;
      } catch (e) {
        // If rerank fails, return scored results
        return scoredResults;
      }

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
    // Temporarily disabled due to pgvector issues
    return false;
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
