const { execSync } = require('child_process');

function log(...args) { console.log('[migrations]', ...args); }

if (!process.env.DATABASE_URL) {
  log('DATABASE_URL not set — skipping `prisma migrate deploy`.');
  process.exit(0);
}

// Basic validation: ensure DATABASE_URL looks like a postgres URL before attempting deploy
const dbUrl = process.env.DATABASE_URL || '';
if (!/^postgres(?:ql)?:\/\//i.test(dbUrl)) {
  log('DATABASE_URL does not look like a Postgres URL — skipping `prisma migrate deploy` (value masked).');
  process.exit(0);
}

try {
  log('Running `npx prisma migrate deploy`...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  log('Migrations applied successfully');
} catch (err) {
  const errMsg = err && err.message ? err.message : String(err);
  console.error('[migrations] Failed to apply migrations:', errMsg);

  // Auto-resolve option for known failed migration
  if (process.env.FORCE_MIGRATION_RESOLVE === 'true' && process.env.FORCE_MIGRATION_NAME) {
    try {
      log(`FORCE_MIGRATION_RESOLVE is enabled - attempting to mark ${process.env.FORCE_MIGRATION_NAME} as applied`);
      execSync(`npx prisma migrate resolve --applied ${process.env.FORCE_MIGRATION_NAME}`, { stdio: 'inherit' });
      log('Migration marked as applied. Re-running `npx prisma migrate deploy`...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      log('Migrations applied successfully after resolution');
      return;
    } catch (resolveErr) {
      console.error('[migrations] Auto-resolve failed:', resolveErr && resolveErr.message ? resolveErr.message : resolveErr);
      log('Auto-resolve failed; please inspect the migration table or run manual resolve from Render shell.');
    }
  }

  log('Continuing without blocking start; please inspect migration failures and run migrations manually if needed.');
}
