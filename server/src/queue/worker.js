const { Worker } = require('bullmq');
const prisma = require('../config/database');
const { summarizeText } = require('../services/summarizer.service');
const { generateEmbedding } = require('../services/embedding.service');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let worker = null;

async function startWorker() {
  if (worker) return worker;
  worker = new Worker('process-chunk', async (job) => {
  const { chunkId } = job.data;
  if (!chunkId) throw new Error('job missing chunkId');

  try {
    const chunk = await prisma.knowledgeChunk.findUnique({ where: { id: chunkId } });
    if (!chunk) throw new Error('Chunk not found: ' + chunkId);

    // skip if already embedded
    if (chunk.embedding) return { skipped: true };

    // Summarize (best-effort)
    let summary = '';
    try {
      summary = await summarizeText(chunk.content, 160);
    } catch (e) {
      logger.warn('Worker: summarization error', { message: e.message || e });
    }

    // Classify type if not present
    let type = (chunk.metadata && chunk.metadata.type) || null;
    if (!type) {
      const txt = (chunk.content || '').toLowerCase();
      if (txt.match(/\b(menu|dish|price|pricing)\b/)) type = 'MENU';
      else if (txt.match(/\b(contact|phone|email|address|location)\b/)) type = 'CONTACT';
      else if (txt.match(/\b(service|services|offer|what we do)\b/)) type = 'SERVICE';
      else if (txt.match(/\b(promo|promotion|discount|sale)\b/)) type = 'PROMOTION';
      else type = 'OTHER';
    }

    let embedding = null;
    try {
      embedding = await generateEmbedding(chunk.content);
    } catch (e) {
      logger.warn('Worker: embedding failed', { message: e.message || e });
    }

    // store metadata merge
    const prevMeta = chunk.metadata || {};
    const newMeta = { ...prevMeta, summary, type };

    // If embedding is available and is numeric array, update both JSON field and pgvector column
    try {
      if (Array.isArray(embedding) && embedding.length > 0 && embedding.every(n => typeof n === 'number' && Number.isFinite(n))) {
        const nums = embedding.map(n => Number(n));

        // Persist JSON embedding and metadata safely using Prisma client
        await prisma.knowledgeChunk.update({ where: { id: chunkId }, data: { embedding: nums, metadata: newMeta } });

        // Persist pgvector column using parameterized query to avoid SQL injection
        // We pass the vector as a parameter and cast it to `vector` in SQL: ($1)::vector
        const vectorLiteral = `[${nums.join(',')}]`;
        try {
          // Temporarily disabled due to pgvector issues
          // await prisma.$executeRaw`
          //   UPDATE "KnowledgeChunk"
          //   SET embedding_vector = ${vectorLiteral}::vector
          //   WHERE id = ${chunkId}
          // `;
          logger.info('Worker: skipping embedding_vector update (pgvector temporarily disabled)');
        } catch (e) {
          // If vector update fails (pgvector not installed or wrong dims), ignore and keep JSON embedding
          logger.warn('Worker: failed to persist embedding_vector (pgvector may be unavailable)', { message: e.message || e });
        }
      } else {
        // Fallback: update JSON embedding only
        await prisma.knowledgeChunk.update({ where: { id: chunkId }, data: { embedding, metadata: newMeta } });
      }
    } catch (e) {
      logger.error('Worker: failed to persist embedding/vector', e);
      // As a fallback, attempt normal update
      try {
        await prisma.knowledgeChunk.update({ where: { id: chunkId }, data: { embedding, metadata: newMeta } });
      } catch (err) {
        logger.error('Worker: fallback update failed', err);
      }
    }

    return { processed: true, id: chunkId };

  } catch (err) {
    logger.error('Worker job processing error:', err);
    throw err;
  }
  }, { connection: { url: REDIS_URL }, concurrency: 3, lockDuration: 60000 });

  worker.on('completed', job => {
    logger.info('Chunk job completed', { jobId: job.id, chunkId: job.data?.chunkId });
  });
  
  worker.on('failed', (job, err) => {
    logger.error('Chunk job failed', { 
      jobId: job.id, 
      chunkId: job.data?.chunkId,
      error: err.message,
      stack: err.stack 
    });
  });

  worker.on('error', (err) => {
    logger.error('Worker error', { error: err.message, stack: err.stack });
  });

  logger.info('Chunk worker running, connected to Redis', { redis: REDIS_URL });
  return worker;
}

async function stopWorker() {
  if (!worker) return;
  try {
    logger.info('Stopping chunk worker...');
    // Wait for active jobs to complete (with timeout)
    await Promise.race([
      worker.close(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Worker close timeout')), 10000))
    ]).catch(err => {
      if (err.message !== 'Worker close timeout') throw err;
      logger.warn('Worker close timeout, forcing close');
    });
    logger.info('Chunk worker stopped successfully');
  } catch (e) {
    logger.warn('Failed to close worker', { message: e.message || e });
  } finally {
    worker = null;
  }
}

// Only auto-start the worker when running as a dedicated process (not when
// required by tests). This allows the code to be required for processing logic
// without creating background connections during unit tests.
if (require.main === module && process.env.NODE_ENV !== 'test') {
  startWorker().catch(err => logger.error('Failed to start worker:', err));
}

module.exports = { startWorker, stopWorker };
