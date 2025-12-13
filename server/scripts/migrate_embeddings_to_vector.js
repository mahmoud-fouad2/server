const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    await prisma.$connect();
    console.log('Fetching knowledge chunks with JSON embeddings...');

    const chunks = await prisma.knowledgeChunk.findMany({
      where: { embedding: { not: null } },
      select: { id: true, embedding: true }
    });

    console.log(`Found ${chunks.length} chunks to migrate`);

    let migrated = 0;
    for (const c of chunks) {
      try {
        const emb = c.embedding;
        if (!Array.isArray(emb) || emb.length === 0) continue;
        const nums = emb.map(x => Number(x)).filter(n => Number.isFinite(n));
        if (nums.length === 0) continue;

        const vectorLiteral = `'[${nums.join(',')}]'::vector`;
        const embeddingJson = JSON.stringify(nums);
        const sql = `UPDATE "KnowledgeChunk" SET embedding = '${embeddingJson}', embedding_vector = ${vectorLiteral} WHERE id = '${c.id}'`;
        await prisma.$executeRawUnsafe(sql);
        migrated++;
      } catch (e) {
        console.warn('Failed to migrate chunk', c.id, e.message || e);
      }
    }

    console.log(`Migration complete. Migrated: ${migrated}/${chunks.length}`);
  } catch (err) {
    console.error('Migration failed', err);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) migrate();

module.exports = { migrate };
