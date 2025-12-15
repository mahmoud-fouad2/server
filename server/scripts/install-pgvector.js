// Use the already-configured Prisma instance to respect Prisma v7 client
// options and any datasource overrides provided by the environment.
const prisma = require('../src/config/database');

async function installPgVector() {
  try {
    console.log('Installing pgvector extension...');
    await prisma.$queryRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log('✅ pgvector extension installed successfully');
  } catch (error) {
    console.error('❌ Failed to install pgvector extension:', error?.message || error);
    // Don't exit, just warn - the app can fall back to keyword search
  } finally {
    // Disconnect so the script exits cleanly
    try {
      await prisma.$disconnect();
    } catch (e) {
      // ignore
    }
  }
}

installPgVector();