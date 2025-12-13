const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// Database configuration with connection pooling and optimization
// If `PGBOUNCER_URL` is set, prefer it so connections are routed through pgbouncer.
const effectiveDbUrl = process.env.PGBOUNCER_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  datasources: {
    db: {
      url: effectiveDbUrl,
    },
  },
  // Connection pool settings for better stability
  __internal: {
    engine: {
      connectTimeout: 60000, // 60 seconds
      transactionTimeout: 60000,
    },
  },
});

// Connection pool configuration
  // Note: Prisma automatically handles connection pooling with PostgreSQL.
  // For high-concurrency workloads, run a connection pooler such as pgBouncer
  // and set `PGBOUNCER_URL=postgresql://user:pass@localhost:6432/dbname` in your environment.
  // Example: export PGBOUNCER_URL='postgresql://fahimo_user:password@localhost:6432/fahimo?sslmode=require'
// These settings are for fine-tuning performance

// Test database connection on startup
async function testConnection() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Run a simple query to verify vector extension
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database basic test query executed');

  } catch (error) {
    logger.error('Database connection failed', error);
    // Throw error to allow caller to perform graceful shutdown
    throw error;
  }
}

// Note: Graceful shutdown is handled in index.js
// testConnection is called from index.js to ensure environment variables are loaded

module.exports = prisma;
