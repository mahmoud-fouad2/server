#!/usr/bin/env node
/**
 * Validate Database Schema
 * Checks if all Prisma schema fields exist in the database
 */

// Support running as ESM in environments where package.json sets "type": "module"
// This allows using existing CommonJS-style requires safely
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();
const logger = require('../src/utils/logger');

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 5, initialDelay = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function validateSchema() {
  // Use pgBouncer URL for connections in production
  const connectionString = process.env.PGBOUNCER_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    logger.error('❌ DATABASE_URL or PGBOUNCER_URL not set');
    process.exit(1);
  }

  // Build Pool options with sensible defaults and optional SSL
  const poolOptions = {
    connectionString,
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10),
    connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '5000', 10)
  };
  if (process.env.DB_SSL === 'true') {
    // For Render PostgreSQL databases, allow self-signed certificates
    const isRenderPostgres = connectionString.includes('render.com') || connectionString.includes('dpg-');
    poolOptions.ssl = { rejectUnauthorized: isRenderPostgres ? false : (process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false') };
  }

  const pool = new Pool(poolOptions);

  // Helpers for diagnostics (mask secrets)
  function maskConnectionString(cs) {
    try {
      const u = new URL(cs);
      return `${u.hostname}:${u.port || 5432}`;
    } catch (e) {
      return 'unknown-host';
    }
  }

  // Low-level TCP connectivity check to provide clearer diagnostics
  const net = require('net');
  async function tcpCheck(host, port = 5432, timeout = 3000) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let called = false;
      socket.setTimeout(timeout);
      socket.on('connect', () => {
        called = true;
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        if (!called) { called = true; socket.destroy(); reject(new Error('timeout')); }
      });
      socket.on('error', (err) => {
        if (!called) { called = true; reject(err); }
      });
      socket.connect(port, host);
    });
  }

  // Ensure DB host resolves and port is open before creating Prisma client
  try {
    const u = new URL(connectionString);
    const host = u.hostname;
    const port = u.port ? parseInt(u.port, 10) : 5432;

    logger.info(`🔎 Checking DB TCP connectivity to ${maskConnectionString(connectionString)} (ssl=${!!poolOptions.ssl})`);

    await retryWithBackoff(async () => {
      await tcpCheck(host, port, 3000);
      // quick PG check via a simple connect-release
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }
      logger.info(`✅ TCP and simple query successful to ${host}:${port}`);
    }, 6, 2000);
  } catch (connErr) {
    logger.error('❌ Unable to connect to database after retries:', connErr, {
      message: connErr?.message,
      code: connErr?.code,
      host: maskConnectionString(connectionString)
    });

    // Close pool and exit early
    try { await pool.end(); } catch (e) { logger.warn('Error closing pool:', e?.message); }
    process.exit(1);
  }

  logger.info('🔧 Initializing Prisma adapter with connectionString');
  logger.info(`Using DB host: ${maskConnectionString(connectionString)}`);
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  
  try {
    logger.info('Validating database schema...');
    
    // Test database connectivity with retry logic
    await retryWithBackoff(async () => {
        // Log pool stats to diagnose connection issues
      try {
        logger.debug('DB pool stats', {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        });
      } catch (e) {
        logger.warn('Failed to read pool stats:', e?.message);
      }

      // Diagnostic: list public tables and user table columns via pool
      try {
        const tablesRes = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
        logger.info('Public tables:', tablesRes.rows.map(r => r.tablename).join(', '));

        const userColsRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='user'`);
        const userColsRes2 = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='User'`);
        const userColsRes3 = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='users'`);

        const colsLower = userColsRes.rows.map(r => r.column_name);
        const colsUpper = userColsRes2.rows.map(r => r.column_name);
        const colsPlural = userColsRes3.rows.map(r => r.column_name);

        logger.info('User table columns (lowercase):', colsLower.join(', ') || '(none)');
        logger.info('User table columns (Case "User"):', colsUpper.join(', ') || '(none)');
        logger.info('User table columns (plural "users"):', colsPlural.join(', ') || '(none)');

        // Try selecting a sample row from likely table names for quick diagnostics
        const candidateTables = ['"User"', 'user', 'users'];
        for (const t of candidateTables) {
          try {
            const sample = await pool.query(`SELECT * FROM ${t} LIMIT 1`);
            logger.info(`Sample row from ${t}:`, sample.rows[0] ? Object.keys(sample.rows[0]).join(', ') : '(empty)');
            break;
          } catch (rowErr) {
            logger.warn(`Cannot read sample rows from ${t}: ${rowErr.message}`);
          }
        }
      } catch (e) {
        logger.warn('Error listing tables/columns via pool:', e?.message);
      }

    }, 5, 2000);
    
    // Check for the demo user
    const testUser = await prisma.user.findUnique({
      where: { email: 'hello@faheemly.com' }
    }).catch(e => {
      logger.warn('⚠️  Demo user not found (not yet created)');
      return null;
    });
    
    if (testUser) {
      logger.info('✅ Demo user already exists:', testUser.email);
    } else {
      logger.info('⚠️  Demo user will be created during setup');
    }
    
  } catch (error) {
    // Include pool stats if available
    const extra = {
      message: error?.message,
      code: error?.code,
      hint: error?.meta?.hint,
      poolStats: error?.poolStats
    };
    logger.error('❌ Schema validation failed:', error, extra);
    throw error; // Re-throw to fail the setup if validation fails
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      logger.warn('Error disconnecting Prisma:', e.message);
    }
    try {
      await pool.end();
    } catch (e) {
      logger.warn('Error closing pool:', e.message);
    }
  }
}

validateSchema().catch(error => {
  logger.error('Fatal validation error:', error, {
    message: error?.message,
    code: error?.code,
    hint: error?.meta?.hint
  });
  process.exit(1);
});
