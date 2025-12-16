const logger = require('../utils/logger');

// Database configuration with connection pooling and optimization
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

  if (process.env.DATABASE_URL !== effectiveDbUrl) process.env.DATABASE_URL = effectiveDbUrl;

  try {
    // Ensure Prisma uses the binary engine in environments where the client
    // might default to the 'client' engine which requires an adapter/accelerateUrl.
    // process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'binary';

    // Lazy-require Prisma so tests / environments without generated client
    // do not fail at module import time.
    let PrismaClient;
    try {
      // Force engine type env for platforms that default to 'client'
      // process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || 'binary';

      PrismaClient = require('@prisma/client').PrismaClient;
    } catch (e) {
      // Prisma client library not installed / generated in this environment
      throw new Error('Prisma client module not available in this environment');
    }

    // Construct PrismaClient with valid Prisma v7+ options
    // Try with current engine settings first
    try {
      _prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
      });
      _initialized = true;
      return _prisma;
    } catch (clientErr) {
      // If Prisma defaults to "client" engine and no adapter is provided, force binary engine
      if (String(clientErr).includes('Using engine type "client"') || 
          String(clientErr).includes('requires either "adapter" or "accelerateUrl"')) {
        logger.warn('Forcing binary engine type due to client engine error');
        process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
        
        // Retry with binary engine forced
        _prisma = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
        });
        _initialized = true;
        return _prisma;
      }
      throw clientErr;
    }
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
