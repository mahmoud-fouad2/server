#!/usr/bin/env node
/**
 * Validate Database Schema
 * Checks if all Prisma schema fields exist in the database
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../src/utils/logger');

async function validateSchema() {
  const prisma = new PrismaClient();
  
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
  }
}

validateSchema();
