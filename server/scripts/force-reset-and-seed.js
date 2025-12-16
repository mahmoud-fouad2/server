#!/usr/bin/env node
/**
 * Destructive reset + seed helper
 * - Drops and recreates public schema
 * - Recreates pgvector extension if applicable
 * - Runs `npx prisma migrate deploy`
 * - Runs `npm run db:seed`
 *
 * IMPORTANT: This is destructive and will **delete all data** in the database.
 */
const { execSync } = require('child_process');
const logger = require('../src/utils/logger');

async function run({ secret } = {}) {
  logger.info('force-reset: starting destructive reset (this will remove ALL data)');

  if (!secret) {
    throw new Error('force-reset: secret is required');
  }

  try {
    const prisma = require('../src/config/database');

    logger.info('force-reset: connecting to database');
    await prisma.$connect();

    logger.info('force-reset: dropping public schema (CASCADE)');
    await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE');
    logger.info('force-reset: creating public schema');
    await prisma.$executeRawUnsafe('CREATE SCHEMA public');

    // Try to recreate pgvector extension if possible
    try {
      logger.info('force-reset: attempting to create pgvector extension if available');
      await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
      logger.info('force-reset: pgvector extension ensured (if allowed by host)');
    } catch (e) {
      logger.warn('force-reset: pgvector extension could not be created (likely permissions)');
    }

    // Ensure prisma client is generated then apply migrations
    logger.info('force-reset: running `npx prisma generate`');
    execSync('npx prisma generate', { stdio: 'inherit' });

    logger.info('force-reset: running `npx prisma migrate deploy`');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    // Run seed script if present
    try {
      logger.info('force-reset: running seed script `npm run db:seed`');
      execSync('npm run db:seed', { stdio: 'inherit' });
      logger.info('force-reset: seed completed successfully');
    } catch (seedErr) {
      logger.warn('force-reset: seed script failed or not present - skipping', seedErr?.message || seedErr);
    }

    logger.info('force-reset: reset and seed process completed successfully');
  } catch (err) {
    logger.error('force-reset: error during reset', err?.message || err);
    throw err;
  }
}

module.exports = { run };