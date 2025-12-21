import prisma from '../config/database.js';
import { CreateKnowledgeInput } from '../shared_local/index.js';
import embeddingService from './embedding.service.js';
import vectorSearchService from './vector-search.service.js';
import webCrawlerService from './web-crawler.service.js';
import queueService from './queue.service.js';
import cacheService from './cache.service.js';
import logger from '../utils/logger.js';

export class KnowledgeService {
  
  async reindex(businessId: string) {
    const entries = await prisma.knowledgeBase.findMany({
      where: { businessId },
      select: { id: true, title: true, content: true }
    });

    let count = 0;
    for (const entry of entries) {
      await queueService.addJob(
        'embeddings',
        'regenerate-embedding',
        {
          knowledgeChunkId: entry.id,
          text: `${entry.title}\n${entry.content}`,
          businessId,
        },
        { priority: 1 } // Low priority
      );
      count++;
    }

    return { count, message: `Queued ${count} entries for re-indexing` };
  }

  async getEntries(businessId: string, options?: {
    search?: string;
    tags?: string[];
    limit?: number;
  }) {
    const where: any = { businessId };

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { content: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options?.tags && options.tags.length > 0) {
      // Note: This is a simple JSON string search, not ideal for production
      where.tags = {
        contains: options.tags[0]
      };
    }

    return prisma.knowledgeBase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
    });
  }

  async createEntry(businessId: string, data: CreateKnowledgeInput) {
    // Create knowledge entry
    const entry = await prisma.knowledgeBase.create({
      data: {
        businessId,
        title: data.question,
        content: data.answer,
        tags: data.tags ? JSON.stringify(data.tags) : '[]',
        source: (data as any).source || 'manual',
        metadata: (data as any).metadata ? JSON.stringify((data as any).metadata) : null,
      }
    });

    // Queue embedding generation (async)
    await queueService.addJob(
      'embeddings',
      'generate-embedding',
      {
        knowledgeChunkId: entry.id,
        text: `${data.question}\n${data.answer}`,
        businessId,
      },
      {
        priority: 3,
        delay: 500, // Small delay to avoid overwhelming the system
      }
    );

    logger.info(`Created knowledge entry ${entry.id} and queued embedding generation`);

    // Clear cache
    await cacheService.delPattern(`knowledge:${businessId}:*`);

    return entry;
  }

  async updateEntry(businessId: string, id: string, data: Partial<CreateKnowledgeInput>) {
    // Ensure ownership
    const entry = await prisma.knowledgeBase.findFirst({
      where: { id, businessId }
    });
    
    if (!entry) throw new Error('Entry not found or access denied');

    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        title: data.question,
        content: data.answer,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        updatedAt: new Date(),
      }
    });

    // Re-generate embedding if content changed
    if (data.question || data.answer) {
      await queueService.addJob(
        'embeddings',
        'regenerate-embedding',
        {
          knowledgeChunkId: id,
          text: `${updated.title}\n${updated.content}`,
          businessId,
        },
        { priority: 2 }
      );

      logger.info(`Queued embedding re-generation for updated entry ${id}`);
    }

    // Clear cache
    await cacheService.delPattern(`knowledge:${businessId}:*`);

    return updated;
  }

  async deleteEntry(businessId: string, id: string) {
    // Ensure ownership
    const entry = await prisma.knowledgeBase.findFirst({
      where: { id, businessId }
    });
    
    if (!entry) throw new Error('Entry not found or access denied');

    // Delete from vector database
    await vectorSearchService.deleteKnowledgeChunk(id);

    // Delete from database
    const deleted = await prisma.knowledgeBase.delete({
      where: { id }
    });

    logger.info(`Deleted knowledge entry ${id} and its embeddings`);

    // Clear cache
    await cacheService.delPattern(`knowledge:${businessId}:*`);

    return deleted;
  }

  async searchKnowledge(businessId: string, query: string, options?: {
    limit?: number;
    minSimilarity?: number;
  }) {
    // Use vector search for semantic search
    const results = await vectorSearchService.searchKnowledge(
      query,
      businessId,
      options?.limit || 10,
      options?.minSimilarity || 0.7
    );

    logger.info(`Vector search found ${results.length} results for query: "${query}"`);

    return results;
  }

  async importFromUrl(businessId: string, url: string, options?: {
    maxDepth?: number;
    maxPages?: number;
  }) {
    // Queue web crawling job
    const job = await queueService.addJob(
      'crawling',
      'crawl-website',
      {
        url,
        businessId,
        maxDepth: options?.maxDepth || 3,
        maxPages: options?.maxPages || 50,
      },
      {
        priority: 1,
      }
    );

    logger.info(`Queued web crawling job for ${url}`);

    if (!job) {
      throw new Error('Failed to queue web crawling job');
    }

    return {
      jobId: job.id,
      status: 'queued',
      message: 'Web crawling started. Knowledge will be added automatically.',
    };
  }

  async importFromText(businessId: string, text: string, options?: {
    chunkSize?: number;
    overlap?: number;
  }) {
    const chunkSize = options?.chunkSize || 1000;
    const overlap = options?.overlap || 200;

    // Split text into chunks
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    logger.info(`Splitting text into ${chunks.length} chunks`);

    // Create knowledge entries for each chunk
    const entries = await Promise.all(
      chunks.map((chunk, index) =>
        prisma.knowledgeBase.create({
          data: {
            businessId,
            title: `Imported Text - Part ${index + 1}`,
            content: chunk,
            source: 'text-import',
            metadata: JSON.stringify({ chunkIndex: index, totalChunks: chunks.length }),
          }
        })
      )
    );

    // Queue batch embedding generation
    await queueService.addJob(
      'batch-embeddings',
      'generate-batch-embeddings',
      {
        businessId,
        knowledgeIds: entries.map(e => e.id),
      },
      { priority: 2 }
    );

    logger.info(`Created ${entries.length} knowledge entries from text import`);

    return {
      entriesCreated: entries.length,
      message: 'Text imported successfully. Embeddings are being generated.',
    };
  }

  async reindexAll(businessId: string) {
    // Queue reindexing job
    const job = await queueService.addJob(
      'reindex-business',
      'reindex',
      {
        businessId,
      },
      { priority: 1 }
    );

    if (!job) {
      throw new Error('Failed to queue reindexing job');
    }

    logger.info(`Queued reindexing job for business ${businessId}`);

    return {
      jobId: job.id,
      status: 'queued',
      message: 'Reindexing started. This may take a few minutes.',
    };
  }

  async getStats(businessId: string) {
    const [total, withEmbeddings] = await Promise.all([
      prisma.knowledgeBase.count({ where: { businessId } }),
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "KnowledgeBase" kb
        WHERE kb."businessId" = ${businessId}
        AND EXISTS (
          SELECT 1 FROM "KnowledgeEmbedding" ke
          WHERE ke."knowledgeId" = kb.id
        )
      ` as Promise<[{ count: bigint }]>,
    ]);

    return {
      total,
      withEmbeddings: Number(withEmbeddings[0]?.count || 0),
      withoutEmbeddings: total - Number(withEmbeddings[0]?.count || 0),
      coveragePercentage: total > 0 ? (Number(withEmbeddings[0]?.count || 0) / total) * 100 : 0,
    };
  }
}
