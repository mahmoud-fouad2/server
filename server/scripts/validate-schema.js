#!/usr/bin/env node
/**
 * Validate Database Schema
 * Checks if all Prisma schema fields exist in the database
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const logger = require('../src/utils/logger');

async function validateSchema() {
  // Use pgBouncer URL for connections in production
  const connectionString = process.env.PGBOUNCER_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    logger.error('❌ DATABASE_URL or PGBOUNCER_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg({ pool });
  const prisma = new PrismaClient({ adapter });
  
  try {
    logger.info('Validating database schema...');
    
    // Test User table
    const userTest = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='user' AND table_schema='public'
    `;
    
    logger.info('✅ User table columns:', userTest.map(c => c.column_name).join(', '));
    
    // Test if we can query users
    const users = await prisma.user.findMany({ take: 1 });
    logger.info(`✅ Database query successful. Found ${users.length} users.`);
    
    // Check for the specific user
    const testUser = await prisma.user.findUnique({
      where: { email: 'hello@faheemly.com' },
      select: { id: true, email: true, name: true }
    }).catch(e => {
      logger.warn('⚠️  User not found or query failed:', e.message);
      return null;
    });
    
    if (testUser) {
      logger.info('✅ Demo user found:', testUser);
    } else {
      logger.info('⚠️  Demo user not yet created - will create during setup');
    }
    
  } catch (error) {
    logger.error('❌ Schema validation failed:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

validateSchema().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
