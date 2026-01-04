import embeddingService from './embedding.service.js';
import logger from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

class VectorSearchService {
  async searchKnowledge(
    query: string,
    businessId: string,
    limit: number = 5,
    minSimilarity: number = 0.3  // Lowered threshold to allow more KB matches
  ): Promise<any[]> {
    try {
      // Generate embeddings for both dimensions (768 and 1024) to handle mixed DB state
      const embeddings: Record<number, number[]> = {};

      // Try Gemini (768)
      try {
        const { embedding } = await embeddingService.generateEmbedding(query, 'GEMINI');
        if (embedding && embedding.length === 768) {
          embeddings[768] = embedding;
        }
      } catch (e) {
        logger.warn('Failed to generate Gemini embedding for query');
      }

      // Try Voyage (1024) - as backup/alternative for older chunks
      try {
        const { embedding } = await embeddingService.generateEmbedding(query, 'VOYAGE');
        if (embedding && embedding.length === 1024) {
          embeddings[1024] = embedding;
        }
      } catch (e) {
        logger.warn('Failed to generate Voyage embedding for query');
      }

      if (Object.keys(embeddings).length === 0) {
        throw new Error('Failed to generate any embeddings for query');
      }

      // Search using manual cosine similarity with multi-dim support
      const results = await embeddingService.searchSimilar(embeddings, businessId, limit * 4);

      // Log raw results for debugging
      logger.info(`Raw vector search returned ${results.length} results`);
      if (results.length > 0) {
        logger.info(`Top result similarity: ${results[0]?.similarity?.toFixed(3)}`);
      }

      // Rerank results
      const reranked = await this.rerankResults(query, results);

      // Filter by minimum similarity and limit
      const filtered = reranked
        .filter((r: any) => (r.similarity ?? r.rerank_score) >= minSimilarity)
        .slice(0, limit);

      logger.info(`Found ${filtered.length} relevant knowledge chunks for query`);

      return filtered;
    } catch (error: any) {
      logger.error('Vector search failed:', error.message);
      return [];
    }
  }

  async rerankResults(query: string, results: any[]): Promise<any[]> {
    if (results.length === 0) return results;

    try {
      // Use Voyage AI Rerank if available
      if (process.env.VOYAGE_API_KEY) {
        const response = await axios.post(
          'https://api.voyageai.com/v1/rerank',
          {
            model: 'rerank-2-lite',
            query: query,
            documents: results.map(r => r.content)
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Map scores back to results
        const reranked = response.data.data.map((item: any) => ({
          ...results[item.index],
          similarity: item.relevance_score
        }));
        
        // Sort by new score
        return reranked.sort((a: any, b: any) => b.similarity - a.similarity);
      }

      // Fallback to simple local reranking
      const scored = results.map((result) => {
        const content = result.content || '';
        const queryLower = query.toLowerCase();
        const contentLower = content.toLowerCase();

        // Boost score if exact match or contains query
        let boost = 1.0;
        if (contentLower.includes(queryLower)) {
          boost = 1.5;
        }

        // Calculate word overlap
        const queryWords = queryLower.split(/\s+/);
        const contentWords = new Set(contentLower.split(/\s+/));
        const overlap = queryWords.filter((w) => contentWords.has(w)).length;
        const overlapScore = overlap / queryWords.length;

        const finalScore = (result.similarity || 0) * boost * (1 + overlapScore);

        return {
          ...result,
          rerank_score: finalScore,
        };
      });

      // Sort by rerank score
      scored.sort((a, b) => b.rerank_score - a.rerank_score);

      logger.info('Reranked search results');

      return scored;
    } catch (error: any) {
      logger.error('Reranking failed:', error.message);
      return results;
    }
  }

  async hybridSearch(
    query: string,
    businessId: string,
    limit: number = 5
  ): Promise<any[]> {
    // Perform vector search
    const vectorResults = await this.searchKnowledge(query, businessId, limit);

    // Rerank for better relevance
    const reranked = await this.rerankResults(query, vectorResults);

    return reranked;
  }

  async indexKnowledgeChunk(
    chunkId: string,
    content: string,
    businessId: string,
    knowledgeBaseId: string,
    metadata: any = {},
    existingEmbedding?: number[]
  ): Promise<boolean> {
    try {
      // Generate embedding if not provided - MUST use GEMINI for consistency (768 dims)
      let embedding = existingEmbedding;
      if (!embedding) {
        const result = await embeddingService.generateEmbedding(content, 'GEMINI');
        embedding = result.embedding;
      }

      // Store in database with pgvector
      await prisma.$executeRaw`
        UPDATE "KnowledgeChunk"
        SET embedding = ${JSON.stringify(embedding)}::vector,
            metadata = ${JSON.stringify(metadata)}::jsonb
        WHERE id = ${chunkId}
      `;

      logger.info(`Indexed knowledge chunk: ${chunkId}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to index chunk ${chunkId}:`, error.message);
      return false;
    }
  }

  async reindexBusiness(businessId: string): Promise<number> {
    try {
      // Get all unindexed chunks
      const chunks = await prisma.knowledgeChunk.findMany({
        where: {
          businessId,
          embedding: null,
        },
        select: {
          id: true,
          content: true,
          knowledgeBaseId: true,
          metadata: true,
        },
      });

      logger.info(`Reindexing ${chunks.length} chunks for business ${businessId}`);

      let indexed = 0;
      for (const chunk of chunks) {
        const success = await this.indexKnowledgeChunk(
          chunk.id,
          chunk.content,
          businessId,
          chunk.knowledgeBaseId || '',
          chunk.metadata || {}
        );
        if (success) indexed++;
      }

      logger.info(`Successfully indexed ${indexed}/${chunks.length} chunks`);
      return indexed;
    } catch (error: any) {
      logger.error(`Reindexing failed for business ${businessId}:`, error.message);
      return 0;
    }
  }

  async deleteKnowledgeChunk(knowledgeId: string): Promise<boolean> {
    try {
      // This project stores embeddings directly on KnowledgeChunk.embedding (pgvector)
      // rather than a separate KnowledgeEmbedding table.
      await prisma.$executeRaw`
        UPDATE "KnowledgeChunk"
        SET embedding = NULL
        WHERE id = ${knowledgeId}
      `;

      logger.info(`Cleared embedding for knowledge chunk ${knowledgeId}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to delete embeddings for knowledge ${knowledgeId}:`, error.message);
      return false;
    }
  }
}

export default new VectorSearchService();
