import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runMigrations() {
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  // Use db push to ensure schema sync on Render Free Tier where migration generation is difficult
  const result = spawnSync(npxCmd, ['prisma', 'db', 'push', '--accept-data-loss'], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    // Don't crash the whole service if migrations fail; log and continue.
    // The app includes runtime fallbacks for older schemas.
    // eslint-disable-next-line no-console
    console.warn('[startup] prisma db push failed; continuing startup');
  }
}

function startServer() {
  const indexJs = path.resolve(__dirname, '..', 'index.js');
  const result = spawnSync(process.execPath, [indexJs], {
    stdio: 'inherit',
  });

  process.exit(result.status ?? 1);
}

runMigrations();
startServer();
