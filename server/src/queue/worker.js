const { Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { summarizeText } = require('../services/summarizer.service');
const { generateEmbedding } = require('../services/embedding.service');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const worker = new Worker('process-chunk', async (job) => {
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
      console.warn('Worker: summarization error', e.message || e);
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
      console.warn('Worker: embedding failed', e.message || e);
    }

    // store metadata merge
    const prevMeta = chunk.metadata || {};
    const newMeta = { ...prevMeta, summary, type };

    await prisma.knowledgeChunk.update({ where: { id: chunkId }, data: { embedding, metadata: newMeta } });
    return { processed: true, id: chunkId };

  } catch (err) {
    console.error('Worker job processing error:', err);
    throw err;
  }
}, { connection: { url: REDIS_URL }, concurrency: 3, lockDuration: 60000 });

worker.on('completed', job => console.log('Chunk job completed', job.id));
worker.on('failed', (job, err) => console.error('Chunk job failed', job.id, err.message));

console.log('Chunk worker running, connected to Redis:', REDIS_URL);
