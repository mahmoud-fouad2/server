const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function markDone() {
  try {
    await prisma.$connect();
    await prisma.systemSetting.upsert({
      where: { key: 'pgvector_migration_done' },
      update: { value: new Date().toISOString(), description: 'PGVector migration finished' },
      create: { key: 'pgvector_migration_done', value: new Date().toISOString(), description: 'PGVector migration finished' }
    });
  } catch (e) {
    console.warn('Could not mark migration as done in DB:', e.message || e);
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
  }
}

(async function run() {
  console.log('Starting safe pgvector migration runner...');

  try {
    // quick guard: see if migration already ran
    await prisma.$connect();
    const existing = await prisma.systemSetting.findUnique({ where: { key: 'pgvector_migration_done' } });
    if (existing) {
      console.log('Migration previously completed at', existing.value);
      await prisma.$disconnect();
      process.exit(0);
    }
    await prisma.$disconnect();
  } catch (e) {
    console.warn('DB not reachable or error while checking migration flag:', e.message || e);
    // continue - we'll still attempt migration since create/migrate scripts also handle connectivity
  }

  try {
    const { createPgVector } = require('./create_pgvector_extension');
    const { migrate } = require('./migrate_embeddings_to_vector');

    try {
      await createPgVector();
    } catch (e) {
      console.warn('createPgVector error (continuing):', e.message || e);
    }

    try {
      await migrate();
    } catch (e) {
      console.warn('migrate error (continuing):', e.message || e);
    }

    // Mark done (best-effort)
    await markDone();

    console.log('Safe pgvector migration runner finished (no errors will be propagated).');
  } catch (err) {
    console.error('Unexpected error in safe runner (will not exit non-zero):', err);
  } finally {
    process.exit(0);
  }
})();
