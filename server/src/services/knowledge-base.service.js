const prisma = require('../config/database');
const vectorSearchService = require('./vector-search.service');
const logger = require('../utils/logger');

class KnowledgeBaseService {
  /**
   * Process knowledge base content into searchable chunks
   * @param {string} businessId - Business ID
   * @param {string} content - Raw content to process
   * @param {string} title - Optional title for the content
   * @returns {Promise<Object>} Processing result
   */
  async processKnowledgeBase(businessId, content, title = '') {
    try {
      logger.info('Knowledge base processing started', { businessId, contentLength: content.length });

      // Split content into chunks (roughly 500 words each)
      const chunks = this.splitIntoChunks(content, 500);

      logger.debug('Content split into chunks', { businessId, chunksCount: chunks.length });

      // Generate embeddings for each chunk
      const chunkPromises = chunks.map(async (chunkContent, index) => {
        try {
          const embedding = await vectorSearchService.generateEmbedding(chunkContent);

          return {
            businessId,
            content: chunkContent,
            embedding,
            chunkIndex: index,
            title: title || `Chunk ${index + 1}`,
            metadata: {
              wordCount: chunkContent.split(/\s+/).length,
              charCount: chunkContent.length
            }
          };
        } catch (error) {
          logger.warn('Failed to generate embedding for knowledge chunk', { businessId, chunkIndex: index, error: error.message });
          return null;
        }
      });

      const chunkData = (await Promise.all(chunkPromises)).filter(chunk => chunk !== null);

      // Store chunks in database
      const createdChunks = await prisma.knowledgeChunk.createMany({
        data: chunkData,
        skipDuplicates: true
      });

      logger.info('Knowledge base chunks stored', { businessId, chunksStored: createdChunks.count });

      return {
        success: true,
        chunksProcessed: chunks.length,
        chunksStored: createdChunks.count,
        businessId
      };

    } catch (error) {
      logger.error('Knowledge base processing failed', { businessId, error: error.message });
      return {
        success: false,
        error: error.message,
        businessId
      };
    }
  }

  /**
   * Split content into manageable chunks
   * @param {string} content - Content to split
   * @param {number} maxWords - Maximum words per chunk
   * @returns {string[]} Array of content chunks
   */
  splitIntoChunks(content, maxWords = 500) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      const currentWords = currentChunk.split(/\s+/).filter(w => w.length > 0);

      if (currentWords.length + words.length <= maxWords) {
        currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence.trim();
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Update knowledge base chunks for a business
   * @param {string} businessId - Business ID
   * @returns {Promise<Object>} Update result
   */
  async updateKnowledgeBaseChunks(businessId) {
    try {
      logger.info('Knowledge base update started', { businessId });

      // Get all knowledge base entries for the business
      const knowledgeBases = await prisma.knowledgeBase.findMany({
        where: { businessId }
      });

      // Clear existing chunks
      await prisma.knowledgeChunk.deleteMany({
        where: { businessId }
      });

      let totalChunks = 0;

      // Process each knowledge base entry
      for (const kb of knowledgeBases) {
        const result = await this.processKnowledgeBase(businessId, kb.content, kb.title);
        if (result.success) {
          totalChunks += result.chunksStored;
        }
      }

      logger.info('Knowledge base update completed', { businessId, totalChunks, knowledgeBasesProcessed: knowledgeBases.length });

      return {
        success: true,
        businessId,
        totalChunks,
        knowledgeBasesProcessed: knowledgeBases.length
      };

    } catch (error) {
      logger.error('Knowledge base update failed', { businessId, error: error.message });
      return {
        success: false,
        error: error.message,
        businessId
      };
    }
  }

  /**
   * Get knowledge base statistics for a business
   * @param {string} businessId - Business ID
   * @returns {Promise<Object>} Statistics
   */
  async getKnowledgeBaseStats(businessId) {
    try {
      const [kbCount, chunkCount] = await Promise.all([
        prisma.knowledgeBase.count({ where: { businessId } }),
        prisma.knowledgeChunk.count({ where: { businessId } })
      ]);

      return {
        businessId,
        knowledgeBases: kbCount,
        chunks: chunkCount,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to get knowledge base statistics', { businessId, error: error.message });
      return {
        businessId,
        error: error.message
      };
    }
  }
}

module.exports = new KnowledgeBaseService();