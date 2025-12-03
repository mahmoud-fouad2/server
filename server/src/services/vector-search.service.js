const prisma = require('../config/database');
const embeddingService = require('./embedding.service');

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
    try {
      // Step 1: Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      
      if (!queryEmbedding || queryEmbedding.length === 0) {
        console.warn('[VectorSearch] Failed to generate query embedding, falling back to keyword search');
        return await this.fallbackKeywordSearch(query, businessId, limit);
      }

      // Step 2: Perform vector similarity search using raw SQL
      // Note: Prisma doesn't support vector operations natively yet
      const results = await prisma.$queryRaw`
        SELECT 
          id,
          "knowledgeBaseId",
          "businessId",
          content,
          metadata,
          "createdAt",
          1 - (embedding <=> ${queryEmbedding}::vector) as similarity
        FROM "KnowledgeChunk"
        WHERE "businessId" = ${businessId}
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `;

      // Step 3: Filter results by similarity threshold (0.7 = 70% similar)
      const filteredResults = results.filter(r => r.similarity >= 0.7);

      if (filteredResults.length === 0) {
        console.log('[VectorSearch] No high-similarity results found, trying keyword search');
        return await this.fallbackKeywordSearch(query, businessId, limit);
      }

      console.log(`[VectorSearch] Found ${filteredResults.length} relevant chunks with similarity > 0.7`);
      return filteredResults;

    } catch (error) {
      // If pgvector is not installed or query fails, fall back to keyword search
      if (error.message.includes('vector') || error.code === '42883') {
        console.warn('[VectorSearch] pgvector not available, using keyword search');
        return await this.fallbackKeywordSearch(query, businessId, limit);
      }

      console.error('[VectorSearch] Error:', error);
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
      const keywords = query.toLowerCase().split(' ').filter(w => w.length > 2);
      
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

      console.log(`[KeywordSearch] Found ${results.length} results for query`);
      return results;

    } catch (error) {
      console.error('[KeywordSearch] Error:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Check if pgvector extension is available
   * 
   * @returns {Promise<boolean>} - True if pgvector is installed
   */
  async isPgVectorAvailable() {
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'vector'
        ) as available
      `;
      return result[0]?.available || false;
    } catch (error) {
      console.error('[VectorSearch] Error checking pgvector availability:', error);
      return false;
    }
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
          embedding: { not: null }
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
      console.error('[VectorSearch] Error getting stats:', error);
      return null;
    }
  }
}

module.exports = new VectorSearchService();
