const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// Database configuration with connection pooling and optimization
// If `PGBOUNCER_URL` is set, prefer it so connections are routed through pgbouncer.
const effectiveDbUrl = process.env.PGBOUNCER_URL || process.env.DATABASE_URL;

// Prisma v7 removed the `datasources` client option; ensure the effective
// DATABASE_URL is set via environment variable before constructing the client.
if (effectiveDbUrl && process.env.DATABASE_URL !== effectiveDbUrl) {
  process.env.DATABASE_URL = effectiveDbUrl;
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
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
// Export helper for tests/startup to optionally validate DB connectivity
module.exports.testConnection = testConnection;
