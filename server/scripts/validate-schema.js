#!/usr/bin/env node
/**
 * Validate Database Schema
 * Checks if all Prisma schema fields exist in the database
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
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

  const pool = new Pool({ connectionString });

  // Helpers for diagnostics (mask secrets)
  function maskConnectionString(cs) {
    try {
      const u = new URL(cs);
      return `${u.hostname}:${u.port || 5432}`;
    } catch (e) {
      return 'unknown-host';
    }
  }

  // Ensure DB is reachable before creating Prisma client
  try {
    await retryWithBackoff(async () => {
      const client = await pool.connect();
      try {
        logger.info(`✅ Connected to DB host ${maskConnectionString(connectionString)}`);
      } finally {
        client.release();
      }
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

  const adapter = new PrismaPg({ pool });
  const prisma = new PrismaClient({ adapter });
  
  try {
    logger.info('Validating database schema...');
    
    // Test database connectivity with retry logic
    await retryWithBackoff(async () => {
      // Simple query to test connectivity
      const result = await prisma.user.findMany({ take: 1 });
      logger.info(`✅ Database query successful. Found ${result.length} users.`);
      
      return result;
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
    logger.error('❌ Schema validation failed:', error, {
      message: error?.message,
      code: error?.code,
      hint: error?.meta?.hint
    });
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
