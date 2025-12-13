const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPgVector() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();

    console.log('Creating extension vector if not exists...');
    try {
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('Extension vector ensured.');
    } catch (e) {
      console.warn('Could not create extension vector (may require superuser):', e.message || e);
    }

    console.log('Adding embedding_vector column to KnowledgeChunk if not exists...');
    try {
      await prisma.$executeRawUnsafe("ALTER TABLE \"KnowledgeChunk\" ADD COLUMN IF NOT EXISTS embedding_vector vector(768);");
      console.log('Column embedding_vector ensured.');
    } catch (e) {
      console.error('Failed to add embedding_vector column:', e.message || e);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createPgVector();
}

module.exports = { createPgVector };
