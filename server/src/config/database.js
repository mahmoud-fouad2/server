const logger = require('../utils/logger');

// Database configuration with connection pooling and optimization
// Prisma v7+ with @prisma/adapter-pg for direct PostgreSQL connection
// If `PGBOUNCER_URL` is set, prefer it so connections are routed through pgbouncer.
// Lazy Prisma initialization to avoid hard failures at module import time
let _prisma = null;
let _initialized = false;

function createPrismaClient() {
  if (_prisma) return _prisma;

  const effectiveDbUrl = process.env.PGBOUNCER_URL || process.env.DATABASE_URL;
  if (!effectiveDbUrl) {
    throw new Error('DATABASE_URL is not configured; Prisma client will not be initialized');
  }

  // Keep DATABASE_URL in sync with effective URL for Prisma tools compatibility
  if (process.env.DATABASE_URL !== effectiveDbUrl) process.env.DATABASE_URL = effectiveDbUrl;

  try {
    // Lazy-require Prisma so tests / environments without generated client
    // do not fail at module import time.
    let PrismaClient, PrismaPg;
    try {
      PrismaClient = require('@prisma/client').PrismaClient;
      PrismaPg = require('@prisma/adapter-pg').PrismaPg;
    } catch (e) {
      // Prisma client library not installed / generated in this environment
      throw new Error('Prisma client module or @prisma/adapter-pg not available: ' + e.message);
    }

    // Initialize adapter for PostgreSQL in Prisma v7+
    // This replaces the need for PRISMA_CLIENT_ENGINE_TYPE env variable
    // The adapter handles connection pooling and ensures binary engine is used
    const adapter = new PrismaPg({
      connectionString: effectiveDbUrl
    });

    // Construct PrismaClient with adapter for Prisma v7+
    _prisma = new PrismaClient({
      adapter,  // Use the PostgreSQL adapter
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
    });
    _initialized = true;
    return _prisma;
  } catch (err) {
    logger.error('Prisma client initialization failed:', err?.message || err);
    _prisma = createPrismaStub(err);
    return _prisma;
  }
}

function createPrismaStub(reason) {
  const message = reason && reason.message ? reason.message : String(reason);

  // Return a recursive proxy that gracefully handles nested property access
  // such as `prisma.paymentGateway.findMany()` by returning callable
  // proxies whose invocation throws a helpful error instead of causing
  // confusing "... is not a function" runtime errors.
  const thrower = function() {
    throw new Error(`Prisma client is not available: ${message}`);
  };

  const handler = {
    get() {
      // Return another proxy so deep property access like `.paymentGateway.findMany`
      // keeps returning callable proxies until invoked, at which point `apply`
      // will throw the helpful error.
      return new Proxy(thrower, handler);
    },
    apply() {
      // When the callable proxy is invoked, throw a clear error.
      throw new Error(`Prisma client is not available: ${message}`);
    }
  };

  return new Proxy(thrower, handler);
}

const prisma = new Proxy({}, {
  get(_target, prop) {
    const client = createPrismaClient();
    const val = client[prop];
    if (typeof val === 'function') return val.bind(client);
    return val;
  }
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
    const dbUrl = process.env.PGBOUNCER_URL || process.env.DATABASE_URL;
    if (!dbUrl || !/^postgres(?:ql)?:\/\//i.test(dbUrl)) {
      logger.warn('Skipping database connection test - DATABASE_URL not configured or not Postgres');
      return;
    }

    const client = createPrismaClient();
    await client.$connect();
    logger.info('Database connected successfully');

    // Run a simple query to verify vector extension
    await client.$queryRaw`SELECT 1`;
    logger.info('Database basic test query executed');

  } catch (error) {
    logger.error('Database connection failed', error);
    throw error;
  }
}

// Note: Graceful shutdown is handled in index.js
// testConnection is called from index.js to ensure environment variables are loaded

module.exports = prisma;
// Export helper for tests/startup to optionally validate DB connectivity
module.exports.testConnection = testConnection;
