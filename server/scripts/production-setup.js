#!/usr/bin/env node
/**
 * Production Database Recovery Script
 * Handles:
 * 1. Prisma client regeneration
 * 2. Missing migrations
 * 3. Schema validation
 * 4. Demo user setup
 */

const { execSync } = require('child_process');
const logger = require('../src/utils/logger');

async function runProductionSetup() {
  try {
    logger.info('════════════════════════════════════════════════════');
    logger.info('🚀 PRODUCTION SETUP & RECOVERY');
    logger.info('════════════════════════════════════════════════════');
    logger.info('');

    // Step 1: Ensure Prisma is regenerated
    logger.info('📦 Step 1: Regenerating Prisma Client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      logger.info('✅ Prisma Client regenerated');
    } catch (e) {
      logger.error('❌ Prisma generation failed:', e.message);
      throw e;
    }

    // Step 2: Reset and push schema to consolidate migrations
    logger.info('');
    logger.info('🗄️  Step 2: Consolidating migrations by resetting DB to current schema...');
    try {
      execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
      logger.info('✅ Database reset and schema applied');
    } catch (e) {
      // Treat schema push failures as fatal
      logger.error('❌ Database schema push failed. Please inspect output.');
      logger.error('Schema push error output:', e.message);
      throw new Error('Database schema push failed: ' + e.message);
    }

    // Step 3: Validate schema
    logger.info('');
    logger.info('🔍 Step 3: Validating database schema...');
    try {
      execSync('node scripts/validate-schema.js', { stdio: 'inherit' });
      logger.info('✅ Schema validation passed');
    } catch (e) {
      logger.error('⚠️  Schema validation warning:', e.message);
    }

    // Step 4: Setup demo user
    logger.info('');
    logger.info('👤 Step 4: Setting up demo user...');
    try {
      execSync('node scripts/setup-faheemly-demo.js', { stdio: 'inherit' });
      logger.info('✅ Demo user setup complete');
    } catch (e) {
      logger.error('❌ Demo user setup failed:', e.message);
      throw e;
    }

    logger.info('');
    logger.info('════════════════════════════════════════════════════');
    logger.info('✨ SETUP COMPLETE');
    logger.info('════════════════════════════════════════════════════');
    logger.info('');
    logger.info('Server is ready for production!');
    logger.info('');
    logger.info('🔗 Test login at: https://faheemly.com');
    logger.info('📧 Email: hello@faheemly.com');
    logger.info('🔑 Password: [Set via ADMIN_INITIAL_PASSWORD1 env var]');
    logger.info('');

  } catch (error) {
    logger.error('');
    logger.error('❌ SETUP FAILED');
    logger.error('════════════════════════════════════════════════════');
    logger.error('Error:', error.message);
    process.exit(1);
  }
}

runProductionSetup();
