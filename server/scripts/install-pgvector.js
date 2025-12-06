const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function installPgVector() {
  try {
    console.log('Installing pgvector extension...');
    await prisma.$queryRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log('✅ pgvector extension installed successfully');
  } catch (error) {
    console.error('❌ Failed to install pgvector extension:', error.message);
    // Don't exit, just warn - the app can fall back to keyword search
  } finally {
    await prisma.$disconnect();
  }
}

installPgVector();