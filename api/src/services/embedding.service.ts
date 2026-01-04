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
    // Google Gemini Primary (New key)
    if (process.env.GEMINI_API_KEY) {
      this.providers.set('GEMINI', {
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
        apiKey: process.env.GEMINI_API_KEY,
        model: 'text-embedding-004',
        dimensions: 768,
      });
    }

    // Google Gemini Backup (Second account with credit)
    if (process.env.GEMINI_API_KEY_BACKUP) {
      this.providers.set('GEMINI_BACKUP', {
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
        apiKey: process.env.GEMINI_API_KEY_BACKUP,
        model: 'text-embedding-004',
        dimensions: 768,
      });
    }

    // Voyage AI (Final Backup - Paid)
    if (process.env.VOYAGE_API_KEY) {
      this.providers.set('VOYAGE', {
        endpoint: 'https://api.voyageai.com/v1/embeddings',
        apiKey: process.env.VOYAGE_API_KEY,
        model: 'voyage-multilingual-2',
        dimensions: 1024,
      });
    }

    logger.info(`Initialized ${this.providers.size} embedding providers: ${Array.from(this.providers.keys()).join(', ')}`);
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

    // Fallback chain: GEMINI → GEMINI_BACKUP → VOYAGE
    const providerOrder = providerKey 
      ? [providerKey] 
      : ['GEMINI', 'GEMINI_BACKUP', 'VOYAGE'];

    let lastError: any;

    // Try each provider in order
    for (const key of providerOrder) {
      if (!this.providers.has(key)) {
        continue;
      }

      const provider = this.providers.get(key);

      try {
        let response;
        
        // Gemini uses different API format
        if (key === 'GEMINI' || key === 'GEMINI_BACKUP') {
          response = await axios.post(
            `${provider.endpoint}?key=${provider.apiKey}`,
            {
              model: provider.model,
              content: {
                parts: [{ text }]
              }
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            }
          );

          const embedding = response.data.embedding.values;
          
          // Cache the embedding
          await cacheService.set(cacheKey, embedding, 86400); // 24 hours

          logger.info(`✅ Embedding generated successfully with ${key}`);

          return {
            embedding,
            tokensUsed: 0,
            provider: key,
          };
        } else {
          // Standard OpenAI-compatible format (Voyage, etc.)
          response = await axios.post(
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

          logger.info(`✅ Embedding generated successfully with ${key}`);

          return {
            embedding,
            tokensUsed,
            provider: key,
          };
        }
      } catch (error: any) {
        lastError = error;
        const statusCode = error.response?.status || 'unknown';
        logger.warn(`⚠️ Provider ${key} failed (${statusCode}): ${error.message}`);
        // Continue to next provider
      }
    }

    // All providers failed
    logger.error('❌ All embedding providers failed');
    throw new Error(`Failed to generate embedding: ${lastError?.message || 'All providers unavailable'}`);
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
