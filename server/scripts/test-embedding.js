const { PrismaClient } = require('@prisma/client');
const embeddingService = require('../src/services/embedding.service');

async function test() {
  try {
    const sample = 'هذا نص تجريبي لاختبار إنشاء embedding باللغة العربية.';
    console.log('Generating embedding for sample text...');
    const emb = await embeddingService.generateEmbedding(sample);
    console.log('Embedding length:', Array.isArray(emb) ? emb.length : 'null or invalid');
    if (Array.isArray(emb)) console.log('First 10 dims:', emb.slice(0, 10));
  } catch (e) {
    console.error('Embedding generation failed:', e.message || e);
  }
}

if (require.main === module) test();

module.exports = { test };
