import logger from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Database configuration with connection pooling and optimization
// Prisma v7+ with @prisma/adapter-pg for direct PostgreSQL connection
// If `PGBOUNCER_URL` is set, prefer it so connections are routed through pgbouncer.
// Lazy Prisma initialization to avoid hard failures at module import time
let _prisma = null;

function createPrismaClient() {
  if (_prisma) return _prisma;

  const effectiveDbUrl = process.env.PGBOUNCER_URL || process.env.DATABASE_URL;
  if (!effectiveDbUrl) {
    // No DATABASE_URL in environment - fall back to a callable stub to make tests and tools work
    logger.warn('DATABASE_URL is not configured; using Prisma stub for non-DB environment');
    _prisma = createPrismaStub(new Error('DATABASE_URL not configured'));
    return _prisma;
  }

  // Keep DATABASE_URL in sync with effective URL for Prisma tools compatibility
  if (process.env.DATABASE_URL !== effectiveDbUrl) process.env.DATABASE_URL = effectiveDbUrl;

  try {
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
  // Create a callable proxy that recursively returns itself for any
  // property access. This makes chained access like
  // `prisma.paymentGateway.findMany()` behave as expected in tests:
  // - `typeof prisma.paymentGateway.findMany === 'function'`
  // - invoking the function returns a rejected Promise with a clear error
  const makeRecursiveCallable = () => {
    const fn = function() {
      return Promise.reject(new Error(`Prisma client is not available: ${message}`));
    };

    const proxy = new Proxy(fn, {
      get() {
        // Any property access returns the same proxy so nested chains
        // (e.g. model.findMany) are functions themselves.
        return proxy;
      },
      apply() {
        // Calling the proxy returns a rejected Promise with a clear error
        return Promise.reject(new Error(`Prisma client is not available: ${message}`));
      }
    });

    return proxy;
  };

  return makeRecursiveCallable();
}

const prisma = new Proxy({}, {
  get(target, prop) {
    // Allow test-suite overrides by checking the proxy's own properties first
    if (prop in target) return target[prop];
    const client = createPrismaClient();
    const val = client[prop];
    if (typeof val === 'function') {
      // Return a callable proxy that preserves both direct invocation and
      // nested property access. This ensures that `prisma.model.findMany`
      // is a function and invoking it will call through to the underlying
      // client (or stub) at call time without triggering proxy traps
      // during the bind phase.
      const surrogate = new Proxy(function() {}, {
        get(_t, subProp) {
          return (...args) => Reflect.apply(Reflect.get(val, subProp), client, args);
        },
        apply(_t, _thisArg, args) {
          return Reflect.apply(val, client, args);
        }
      });

      return surrogate;
    }
    return val;
  },
  set(target, prop, value) {
    // Allow tests and runtime to override certain model methods for mocking
    target[prop] = value;
    return true;
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

export default prisma;
export { testConnection };
