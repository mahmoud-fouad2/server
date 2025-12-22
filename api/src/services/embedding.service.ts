import axios from 'axios';
import logger from '../utils/logger.js';
import { cacheService } from './cache.service.js';

interface EmbeddingResponse {
  embedding: number[];
  tokensUsed: number;
  provider: string;
}

class EmbeddingService {
  private providers: Map<string, any> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Voyage AI (Best for embeddings)
    if (process.env.VOYAGE_API_KEY) {
      this.providers.set('VOYAGE', {
        endpoint: 'https://api.voyageai.com/v1/embeddings',
        apiKey: process.env.VOYAGE_API_KEY,
        model: 'voyage-multilingual-2',
        dimensions: 1024,
      });
    }

    // OpenAI (Fallback)
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('OPENAI', {
        endpoint: 'https://api.openai.com/v1/embeddings',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'text-embedding-3-small',
        dimensions: 1536,
      });
    }

    // Groq embeddings (if available)
    if (process.env.GROQ_API_KEY) {
      this.providers.set('GROQ', {
        endpoint: 'https://api.groq.com/openai/v1/embeddings',
        apiKey: process.env.GROQ_API_KEY,
        model: 'nomic-embed-text-v1.5',
        dimensions: 768,
      });
    }

    logger.info(`Initialized ${this.providers.size} embedding providers`);
  }

  async generateEmbedding(text: string, providerKey?: string): Promise<EmbeddingResponse> {
    // Check cache
    const cacheKey = `embedding:${text.substring(0, 100)}`;
    const cached = await cacheService.get<number[]>(cacheKey);
    
    if (cached) {
      return {
        embedding: cached,
        tokensUsed: 0,
        provider: 'cache',
      };
    }

    // Select provider
    let provider;
    let selectedKey;

    if (providerKey && this.providers.has(providerKey)) {
      provider = this.providers.get(providerKey);
      selectedKey = providerKey;
    } else {
      // Use first available provider
      const entries = Array.from(this.providers.entries());
      if (entries.length === 0) {
        throw new Error('No embedding providers configured');
      }
      [selectedKey, provider] = entries[0];
    }

    try {
      const response = await axios.post(
        provider.endpoint,
        {
          input: text,
          model: provider.model,
        },
        {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const embedding = response.data.data[0].embedding;
      const tokensUsed = response.data.usage?.total_tokens || 0;

      // Cache the embedding
      await cacheService.set(cacheKey, embedding, 86400); // 24 hours

      return {
        embedding,
        tokensUsed,
        provider: selectedKey,
      };
    } catch (error: any) {
      logger.error(`Embedding generation failed with ${selectedKey}:`, error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
    const results = await Promise.all(
      texts.map((text) => this.generateEmbedding(text))
    );
    return results;
  }

  async searchSimilar(
    queryEmbedding: number[],
    businessId: string,
    limit: number = 5
  ): Promise<any[]> {
    try {
      // This would use pgvector in production
      // For now, we'll import prisma directly
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Use raw SQL for vector similarity search
      const results = await prisma.$queryRaw`
        SELECT 
          id,
          "knowledgeBaseId",
          content,
          metadata,
          1 - (embedding <=> ${queryEmbedding}::vector) as similarity
        FROM "KnowledgeChunk"
        WHERE "businessId" = ${businessId}
        ORDER BY embedding <=> ${queryEmbedding}::vector
        LIMIT ${limit}
      `;

      await prisma.$disconnect();
      return results as any[];
    } catch (error: any) {
      logger.error('Vector search failed:', error.message);
      return [];
    }
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

export default new EmbeddingService();
