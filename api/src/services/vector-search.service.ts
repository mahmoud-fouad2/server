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
    minSimilarity: number = 0.7
  ): Promise<any[]> {
    try {
      // Generate embedding for the query
      const { embedding } = await embeddingService.generateEmbedding(query);

      // Search using pgvector
      const results = await embeddingService.searchSimilar(embedding, businessId, limit * 4);

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
      // Generate embedding if not provided
      let embedding = existingEmbedding;
      if (!embedding) {
        const result = await embeddingService.generateEmbedding(content);
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
      await prisma.$executeRaw`
        DELETE FROM "KnowledgeEmbedding"
        WHERE "knowledgeId" = ${knowledgeId}
      `;

      logger.info(`Deleted embeddings for knowledge ${knowledgeId}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to delete embeddings for knowledge ${knowledgeId}:`, error.message);
      return false;
    }
  }
}

export default new VectorSearchService();
