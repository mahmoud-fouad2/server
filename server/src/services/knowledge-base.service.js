import prisma from '../config/database.js';
import vectorSearchService from './vector-search.service.js';
import logger from '../utils/logger.js';

class KnowledgeBaseService {
  /**
   * Process knowledge base content into searchable chunks
   * @param {string} businessId - Business ID
   * @param {string} content - Raw content to process
   * @param {string} title - Optional title for the content
   * @returns {Promise<Object>} Processing result
   */
  async processKnowledgeBase(businessId, content, title = '', knowledgeBaseId = null) {
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
              knowledgeBaseId,
              businessId,
              content: chunkContent,
              embedding,
              metadata: {
                title: title || `Chunk ${index + 1}`,
                chunkIndex: index,
                wordCount: chunkContent.split(/\s+/).length,
                charCount: chunkContent.length
              }
            };
        } catch (error) {
          logger.warn('Failed to generate embedding for knowledge chunk', { businessId, chunkIndex: index, error: error.message });
          return null;
        }
      });

      // Resolve embeddings and prepare chunk data
      const chunkData = (await Promise.all(chunkPromises)).filter(chunk => chunk !== null);

      // If knowledgeBaseId is not provided, create a knowledge base record to attach chunks to
      if (!knowledgeBaseId) {
        try {
          const created = await prisma.knowledgeBase.create({
            data: { businessId, type: 'TEXT', content, metadata: { title: title || 'Untitled' } }
          });
          knowledgeBaseId = created.id;
          logger.info('Created knowledgeBase for chunks', { businessId, knowledgeBaseId });
        } catch (e) {
          logger.warn('Failed to create knowledgeBase record for chunks', { businessId, error: e?.message || e });
        }
      }

      // Ensure chunkData references the created knowledgeBaseId (map after possible creation)
      if (knowledgeBaseId && Array.isArray(chunkData) && chunkData.length > 0) {
        chunkData.forEach(c => { c.knowledgeBaseId = knowledgeBaseId; });
      }

      logger.debug('Preparing to store chunks', { businessId, knowledgeBaseId, chunksFound: chunks.length, chunkDataLength: chunkData.length });
      if (Array.isArray(chunkData) && chunkData.length > 0) {
        logger.debug('Sample chunkData before createMany', { sample: chunkData[0], sampleKnowledgeBaseId: chunkData[0].knowledgeBaseId });
      }

      // Store chunks in database
      // Defensive: ensure chunkData is an array before createMany
      if (!Array.isArray(chunkData) || chunkData.length === 0) {
        logger.warn('No chunk data generated for knowledge base processing', { businessId, chunksFound: chunks.length, chunkDataLength: Array.isArray(chunkData) ? chunkData.length : 'invalid' });
        return {
          success: true,
          chunksProcessed: chunks.length,
          chunksStored: 0,
          businessId
        };
      }

      let createdChunks;
      try {
        createdChunks = await prisma.knowledgeChunk.createMany({
          data: chunkData,
          skipDuplicates: true
        });
      } catch (e) {
        logger.error('Prisma createMany failed in knowledge-base.service', { businessId, error: e && e.message, sample: chunkData.slice(0,3) });
        throw e;
      }

      logger.info('Knowledge base chunks stored', { businessId, chunksStored: createdChunks.count });

      return {
        success: true,
        chunksProcessed: chunks.length,
        chunksStored: createdChunks.count,
        businessId
      };

    } catch (error) {
      logger.error('Knowledge base processing failed', { businessId, error: error && (error.message || error), stack: error && error.stack });
      return {
        success: false,
        error: error && (error.message || String(error)),
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
        const result = await this.processKnowledgeBase(businessId, kb.content, kb.title, kb.id);
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

export default new KnowledgeBaseService();