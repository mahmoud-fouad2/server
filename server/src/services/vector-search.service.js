import prisma from '../config/database.js';
import { generateEmbedding, cosineSimilarity, findSimilarItems } from './embedding.service.js';
import { rerankCandidates } from './rerank.service.js';
import logger from '../utils/logger.js';

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
   * Uses embeddings + cosine similarity (free tier compatible, no pgvector needed)
   * 
   * @param {string} query - User's question/message
   * @param {string} businessId - Business ID to filter results
   * @param {number} limit - Maximum number of results (default: 5)
   * @returns {Promise<Array>} - Array of relevant knowledge chunks
   */
  async searchKnowledge(query, businessId, limit = 5, threshold = null) {
    const originalQuery = query;
    
    try {
      logger.info('Starting vector search with embeddings', { businessId, queryLength: query.length });
      
      // Use embedding-based vector search (works without pgvector)
      const similarityThreshold = threshold || parseFloat(process.env.VECTOR_SIMILARITY_THRESHOLD || '0.5');
      return await this.vectorSearch(query, businessId, limit, similarityThreshold);
    } catch (vectorError) {
      logger.warn('Vector search with embeddings failed, using enhanced keyword search', { 
        businessId, 
        error: vectorError.message 
      });
      
      // Fallback to enhanced keyword search
      return await this.enhancedKeywordSearch(query, businessId, limit);
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
    // Use the enhanced keyword search
    return await this.enhancedKeywordSearch(query, businessId, limit);
  }

  /**
   * Check if vector search is available
   * On free tier, always returns true (uses embeddings + cosine similarity)
   * 
   * @returns {Promise<boolean>} - True if vector search is available
   */
  async isPgVectorAvailable() {
    // On free tier, we use embedding-based search which doesn't require pgvector
    // This always returns true, but we could check for embedding availability
    try {
      const testChunk = await prisma.knowledgeChunk.findFirst({
        select: { embedding: true }
      });
      return true; // Embedding service is available
    } catch (error) {
      logger.debug('Vector search not available', { error: error.message });
      return false;
    }
  }

  /**
   * Generate embedding for text using the embedding service
   * @param {string} text - Text to embed
   * @returns {Promise<Array>} - Embedding vector
   */
  async generateEmbedding(text) {
    return await generateEmbedding(text);
  }

  /**
   * Get statistics about vector search performance
   * For free tier: shows embedding coverage instead of pgvector coverage
   *
   * @param {string} businessId - Business ID
   * @returns {Promise<Object>} - Stats object
   */
  async getSearchStats(businessId) {
    try {
      const totalChunks = await prisma.knowledgeChunk.count({
        where: { businessId }
      });

      // Count chunks with embeddings (our free-tier vector search method)
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
        isPgVectorAvailable: false, // Free tier doesn't use pgvector
        usingEmbeddingBasedSearch: true, // Using Gemini embeddings + cosine similarity
        method: 'embedding-based (free tier compatible)'
      };
    } catch (error) {
      logger.error('Failed to get vector search statistics', { businessId, error: error.message });
      return null;
    }
  }

  /**
   * Perform vector similarity search using embeddings + cosine similarity
   * Works on free tier without pgvector extension
   */
  async vectorSearch(query, businessId, limit = 5, threshold = 0.5) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query);
      
      if (!queryEmbedding || queryEmbedding.length === 0) {
        logger.warn('Failed to generate embedding for query, falling back to keyword search');
        return await this.enhancedKeywordSearch(query, businessId, limit);
      }

      logger.debug('Query embedding generated', { businessId, embeddingLength: queryEmbedding.length });

      // Fetch all knowledge chunks for this business
      // On free tier, this is more practical than database-level vector search
      const allChunks = await prisma.knowledgeChunk.findMany({
        where: { businessId },
        select: {
          id: true,
          businessId: true,
          content: true,
          metadata: true,
          embedding: true,
          createdAt: true
        },
        take: 1000 // Limit to prevent memory issues
      });

      if (allChunks.length === 0) {
        logger.debug('No knowledge chunks found, falling back to keyword search', { businessId });
        return await this.enhancedKeywordSearch(query, businessId, limit);
      }

      // Calculate cosine similarity for each chunk
      const chunksWithSimilarity = allChunks
        .map(chunk => {
          let chunkEmbedding = chunk.embedding;
          
          // Parse embedding if it's stored as JSON string
          if (typeof chunkEmbedding === 'string') {
            try {
              chunkEmbedding = JSON.parse(chunkEmbedding);
            } catch (e) {
              logger.warn('Failed to parse chunk embedding', { chunkId: chunk.id });
              return null;
            }
          }

          // Calculate cosine similarity
          const similarity = Array.isArray(chunkEmbedding) 
            ? cosineSimilarity(queryEmbedding, chunkEmbedding)
            : 0;

          return {
            ...chunk,
            similarity
          };
        })
        .filter(chunk => chunk !== null && chunk.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      logger.debug('Vector search completed using embeddings', { 
        businessId, 
        resultsCount: chunksWithSimilarity.length, 
        threshold 
      });

      // Apply LLM-based reranking if available
      try {
        if (chunksWithSimilarity.length > 1) {
          const rerankedResults = await rerankCandidates(query, chunksWithSimilarity);
          if (rerankedResults && rerankedResults.length > 0) {
            logger.debug('Reranking applied successfully', { businessId, originalCount: chunksWithSimilarity.length });
            return rerankedResults;
          }
        }
      } catch (rerankError) {
        logger.warn('Reranking failed, using original order', { error: rerankError.message, businessId });
      }

      return chunksWithSimilarity.map(row => ({
        id: row.id,
        businessId: row.businessId,
        content: row.content,
        metadata: row.metadata,
        similarity: parseFloat((row.similarity * 100).toFixed(2)) // Convert to percentage
      }));

    } catch (error) {
      logger.warn('Vector search failed, falling back to keyword search', { error: error.message, businessId });
      return await this.enhancedKeywordSearch(query, businessId, limit);
    }
  }

  /**
   * Enhanced keyword search with better relevance scoring
   */
  async enhancedKeywordSearch(query, businessId, limit = 5) {
    try {
      // Enhanced keyword extraction
      const keywords = this.extractKeywords(query);
      
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
          metadata: kb.metadata,
          relevanceScore: 0.1 // Low relevance for fallback
        }));
      }

      // Search in knowledge chunks first
      let chunkResults = [];
      try {
        chunkResults = await prisma.knowledgeChunk.findMany({
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
          take: limit * 2
        });
      } catch (error) {
        logger.warn('Knowledge chunk search failed', error);
      }

      // Also search in knowledge bases
      let kbResults = [];
      try {
        kbResults = await prisma.knowledgeBase.findMany({
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
          take: limit
        });
      } catch (error) {
        logger.warn('Knowledge base search failed', error);
      }

      // Combine and score results
      const allResults = [
        ...chunkResults.map(chunk => ({
          id: chunk.id,
          businessId: chunk.businessId,
          content: chunk.content,
          metadata: chunk.metadata,
          type: 'chunk',
          createdAt: chunk.createdAt
        })),
        ...kbResults.map(kb => ({
          id: kb.id,
          businessId: kb.businessId,
          content: kb.content,
          metadata: kb.metadata,
          type: 'knowledge_base',
          createdAt: kb.createdAt
        }))
      ];

      // Score by keyword matches and recency
      const scoredResults = allResults.map(item => {
        const contentLower = item.content.toLowerCase();
        const matchCount = keywords.filter(kw => contentLower.includes(kw)).length;
        const daysSinceCreation = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 1 - (daysSinceCreation / 365)); // Prefer newer content
        
        return {
          ...item,
          relevanceScore: (matchCount * 0.7) + (recencyScore * 0.3)
        };
      })
      .filter(item => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

      logger.debug('Enhanced keyword search completed', { 
        businessId, 
        keywords: keywords.length,
        chunkResults: chunkResults.length,
        kbResults: kbResults.length,
        finalResults: scoredResults.length 
      });

      // Apply LLM-based reranking if available
      try {
        if (scoredResults.length > 1) {
          const rerankedResults = await rerankCandidates(query, scoredResults);
          if (rerankedResults && rerankedResults.length > 0) {
            logger.debug('Reranking applied to keyword search', { businessId, originalCount: scoredResults.length });
            scoredResults = rerankedResults;
          }
        }
      } catch (rerankError) {
        logger.warn('Reranking failed for keyword search, using original order', { error: rerankError.message, businessId });
      }

      return scoredResults;

    } catch (error) {
      logger.error('Enhanced keyword search failed', error);
      return [];
    }
  }

  /**
   * Extract meaningful keywords from query
   */
  extractKeywords(query) {
    return query
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u) // Split on non-alphanumeric characters
      .map(w => w.trim())
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
      .filter((w, i, arr) => arr.indexOf(w) === i); // Remove duplicates
  }
}

export default new VectorSearchService();
