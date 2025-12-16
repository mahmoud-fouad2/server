const { execSync } = require('child_process');

function log(...args) { console.log('[migrations]', ...args); }

if (!process.env.DATABASE_URL) {
  log('DATABASE_URL not set — skipping `prisma migrate deploy`.');
  process.exit(0);
}

try {
  log('Running `npx prisma migrate deploy`...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  log('Migrations applied successfully');
} catch (err) {
  console.error('[migrations] Failed to apply migrations:', err && err.message ? err.message : err);
  log('Continuing without blocking start; please inspect migration failures and run migrations manually if needed.');
}
