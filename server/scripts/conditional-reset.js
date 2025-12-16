#!/usr/bin/env node
/**
 * Conditional startup hook to run a destructive reset + seed when explicitly enabled.
 *
 * Usage: set FORCE_DATABASE_RESET=true and FORCE_DATABASE_RESET_SECRET to a secret value
 * (for safety, reuse ADMIN_MIGRATION_SECRET). Also set FORCE_DATABASE_RESET_CONFIRMATION=CONFIRM_RESET
 * to avoid accidental invocation.
 */
const logger = require('../src/utils/logger');

async function main() {
  const shouldReset = process.env.FORCE_DATABASE_RESET === 'true';
  if (!shouldReset) {
    logger.info('conditional-reset: FORCE_DATABASE_RESET not set; skipping destructive reset');
    return process.exit(0);
  }

  const providedSecret = process.env.FORCE_DATABASE_RESET_SECRET || process.env.ADMIN_MIGRATION_SECRET;
  if (!providedSecret) {
    logger.error('conditional-reset: FORCE_DATABASE_RESET_SECRET or ADMIN_MIGRATION_SECRET not set - aborting reset');
    return process.exit(1);
  }

  // Extra safety: require an explicit confirmation string
  const confirmation = process.env.FORCE_DATABASE_RESET_CONFIRMATION;
  if (confirmation !== 'CONFIRM_RESET') {
    logger.error('conditional-reset: FORCE_DATABASE_RESET_CONFIRMATION not set to CONFIRM_RESET - aborting');
    return process.exit(1);
  }

  try {
    // Defer requiring heavy modules until we know we should reset
    const reset = require('./force-reset-and-seed');
    await reset.run({ secret: providedSecret });
    logger.info('conditional-reset: reset completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('conditional-reset: failed to run reset', err?.message || err);
    process.exit(1);
  }
}

main();