import prisma from '../config/database.js';
import { CreateKnowledgeInput } from '../shared_local/index.js';
import embeddingService from './embedding.service.js';
import vectorSearchService from './vector-search.service.js';
import webCrawlerService from './web-crawler.service.js';
import queueService from './queue.service.js';
import { cacheService } from './cache.service.js';
import logger from '../utils/logger.js';

export class KnowledgeService {

  private async checkDatabaseHealth() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database Health Check Failed:', error);
      return false;
    }
  }

  private async createSingleChunk(params: {
    businessId: string;
    knowledgeBaseId: string;
    content: string;
    metadata?: any;
  }) {
    const chunk = await prisma.knowledgeChunk.create({
      data: {
        businessId: params.businessId,
        knowledgeBaseId: params.knowledgeBaseId,
        content: params.content,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      },
    });
    return chunk;
  }

  private async indexChunkNow(params: {
    chunkId: string;
    content: string;
    businessId: string;
    knowledgeBaseId: string;
    metadata?: any;
  }) {
    await vectorSearchService.indexKnowledgeChunk(
      params.chunkId,
      params.content,
      params.businessId,
      params.knowledgeBaseId,
      params.metadata || {}
    );
  }
  
  async reindex(businessId: string) {
    if (!(await this.checkDatabaseHealth())) {
      throw new Error('Database unavailable, cannot reindex');
    }

    const chunks = await prisma.knowledgeChunk.findMany({
      where: { businessId },
      select: { id: true, content: true, knowledgeBaseId: true, metadata: true },
    });

    let queuedOrProcessed = 0;

    for (const chunk of chunks) {
      const job = await queueService.addJob(
        'embeddings',
        'regenerate-embedding',
        {
          knowledgeChunkId: chunk.id,
          text: chunk.content,
          businessId,
          knowledgeBaseId: chunk.knowledgeBaseId || chunk.id,
        },
        { priority: 1 }
      );

      if (!job) {
        await this.indexChunkNow({
          chunkId: chunk.id,
          content: chunk.content,
          businessId,
          knowledgeBaseId: chunk.knowledgeBaseId || chunk.id,
          metadata: chunk.metadata ? JSON.parse(chunk.metadata as any) : {},
        });
      }

      queuedOrProcessed++;
    }

    return {
      count: queuedOrProcessed,
      message: chunks.length
        ? 'Reindex started (queued if Redis available, otherwise processed inline)'
        : 'No knowledge chunks found to reindex',
    };
  }

  async updateEntry(businessId: string, id: string, data: Partial<CreateKnowledgeInput>) {
    const entry = await prisma.knowledgeBase.findFirst({
      where: { id, businessId },
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        title: data.question,
        content: data.answer,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });

    // If content changed, we must re-chunk and re-index
    if (data.question || data.answer) {
      // Delete old chunks
      await prisma.knowledgeChunk.deleteMany({
        where: { knowledgeBaseId: id },
      });

      // Create new single chunk (simple strategy for manual edits)
      const chunkContent = `${updated.title}\n${updated.content}`;
      const chunk = await this.createSingleChunk({
        businessId,
        knowledgeBaseId: id,
        content: chunkContent,
        metadata: data.metadata,
      });

      // Index it
      const job = await queueService.addJob(
        'embeddings',
        'generate-embedding',
        {
          knowledgeChunkId: chunk.id,
          text: chunkContent,
          businessId,
          knowledgeBaseId: id,
        },
        { priority: 5 }
      );

      if (!job) {
        await this.indexChunkNow({
          chunkId: chunk.id,
          content: chunkContent,
          businessId,
          knowledgeBaseId: id,
          metadata: data.metadata,
        });
      }
    }

    return updated;
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

    // Keep embeddings on KnowledgeChunk (pgvector). Create one chunk per entry.
    const chunkContent = `${data.question}\n${data.answer}`;
    const chunk = await this.createSingleChunk({
      businessId,
      knowledgeBaseId: entry.id,
      content: chunkContent,
      metadata: { source: entry.source },
    });

    // Queue embedding generation when Redis is available; otherwise index inline.
    const job = await queueService.addJob(
      'embeddings',
      'generate-embedding',
      {
        knowledgeChunkId: chunk.id,
        text: chunkContent,
        businessId,
        knowledgeBaseId: entry.id,
      },
      {
        priority: 3,
        delay: 500, // Small delay to avoid overwhelming the system
      }
    );

    if (!job) {
      await this.indexChunkNow({
        chunkId: chunk.id,
        content: chunkContent,
        businessId,
        knowledgeBaseId: entry.id,
        metadata: { source: entry.source },
      });
    }

    logger.info(`Created knowledge entry ${entry.id} and queued embedding generation`);

    // Clear cache
    await cacheService.delPattern(`knowledge:${businessId}:*`);

    return entry;
  }

  async deleteEntry(businessId: string, id: string) {
    // Ensure ownership
    const entry = await prisma.knowledgeBase.findFirst({
      where: { id, businessId }
    });
    
    if (!entry) throw new Error('Entry not found or access denied');

    // Delete chunks (and embeddings stored on them)
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { businessId, knowledgeBaseId: id },
      select: { id: true },
    });

    await Promise.all(chunks.map((c) => vectorSearchService.deleteKnowledgeChunk(c.id)));
    await prisma.knowledgeChunk.deleteMany({ where: { businessId, knowledgeBaseId: id } });

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
    // Prefer queue/worker if available; otherwise run inline (no Redis/env vars needed).
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

    if (job) {
      logger.info(`Queued web crawling job for ${url}`);
      return {
        jobId: job.id,
        status: 'queued',
        message: 'Web crawling started. Knowledge will be added automatically.',
      };
    }

    logger.warn('Redis/queue unavailable; running crawl inline (may take a while)');

    const maxDepth = options?.maxDepth || 3;
    const maxPages = options?.maxPages || 50;
    const results = await webCrawlerService.crawlWebsite(url, { maxDepth, maxPages });

    let stored = 0;
    for (const page of results) {
      if (!page.content || page.content.length < 100) continue;

      const knowledgeBase = await prisma.knowledgeBase.create({
        data: {
          businessId,
          content: page.content,
          title: page.title || page.url,
          source: page.url,
          metadata: JSON.stringify({
            description: (page as any).metadata?.description,
            keywords: (page as any).metadata?.keywords,
            crawledAt: new Date(),
          }),
        },
      });

      const chunk = await this.createSingleChunk({
        businessId,
        knowledgeBaseId: knowledgeBase.id,
        content: page.content,
        metadata: { source: page.url, title: page.title },
      });

      await this.indexChunkNow({
        chunkId: chunk.id,
        content: page.content,
        businessId,
        knowledgeBaseId: knowledgeBase.id,
        metadata: { source: page.url, title: page.title },
      });

      stored++;
    }

    return {
      status: 'completed',
      pagesCrawled: results.length,
      entriesCreated: stored,
      message: 'Crawl completed inline and knowledge was indexed.',
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

    // Create knowledge entries + chunks for each chunk
    const createdChunks: { id: string; content: string; knowledgeBaseId: string }[] = [];
    for (let index = 0; index < chunks.length; index++) {
      const chunkText = chunks[index];
      const kb = await prisma.knowledgeBase.create({
        data: {
          businessId,
          title: `Imported Text - Part ${index + 1}`,
          content: chunkText,
          source: 'text-import',
          metadata: JSON.stringify({ chunkIndex: index, totalChunks: chunks.length }),
        },
      });

      const knowledgeChunk = await this.createSingleChunk({
        businessId,
        knowledgeBaseId: kb.id,
        content: chunkText,
        metadata: { source: 'text-import', chunkIndex: index, totalChunks: chunks.length },
      });

      createdChunks.push({ id: knowledgeChunk.id, content: chunkText, knowledgeBaseId: kb.id });
    }

    // Queue batch embedding generation when possible; otherwise index inline.
    const batchJob = await queueService.addJob(
      'batch-embeddings',
      'generate-batch-embeddings',
      {
        businessId,
        knowledgeIds: createdChunks.map((c) => c.id),
      },
      { priority: 2 }
    );

    if (!batchJob) {
      for (const c of createdChunks) {
        await this.indexChunkNow({
          chunkId: c.id,
          content: c.content,
          businessId,
          knowledgeBaseId: c.knowledgeBaseId,
          metadata: { source: 'text-import' },
        });
      }
    }

    logger.info(`Created ${createdChunks.length} knowledge entries from text import`);

    return {
      entriesCreated: createdChunks.length,
      message: batchJob
        ? 'Text imported successfully. Embeddings are being generated.'
        : 'Text imported successfully. Embeddings were generated inline.',
    };
  }

  async reindexAll(businessId: string) {
    const job = await queueService.addJob(
      'reindex-business',
      'reindex',
      { businessId },
      { priority: 1 }
    );

    if (job) {
      logger.info(`Queued reindexing job for business ${businessId}`);
      return {
        jobId: job.id,
        status: 'queued',
        message: 'Reindexing started. This may take a few minutes.',
      };
    }

    const inline = await vectorSearchService.reindexBusiness(businessId);
    return {
      status: 'completed',
      count: inline,
      message: 'Reindex completed inline (no Redis/worker).',
    };
  }

  async getStats(businessId: string) {
    const [totalEntries, totalChunks, chunksWithEmbeddings] = await Promise.all([
      prisma.knowledgeBase.count({ where: { businessId } }),
      prisma.knowledgeChunk.count({ where: { businessId } }),
      prisma.knowledgeChunk.count({ where: { businessId, embedding: { not: null } } }),
    ]);

    return {
      entries: totalEntries,
      chunks: totalChunks,
      chunksWithEmbeddings,
      chunksWithoutEmbeddings: totalChunks - chunksWithEmbeddings,
      coveragePercentage: totalChunks > 0 ? (chunksWithEmbeddings / totalChunks) * 100 : 0,
    };
  }
}
