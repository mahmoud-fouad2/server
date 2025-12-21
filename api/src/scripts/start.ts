import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runMigrations() {
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  
  console.log('🔄 Starting Prisma migrations...');
  
  // Step 1: Generate Prisma Client first
  console.log('📦 Generating Prisma Client...');
  const generateResult = spawnSync(npxCmd, ['prisma', 'generate'], {
    stdio: 'inherit',
  });
  
  if (generateResult.status !== 0) {
    console.error('❌ Prisma generate failed!');
  } else {
    console.log('✅ Prisma Client generated successfully');
  }
  
  // Step 2: Run manual migration script
  console.log('🔧 Running manual migration script...');
  const migrateResult = spawnSync(process.execPath, [
    path.resolve(__dirname, 'migrate.js')
  ], {
    stdio: 'inherit',
  });
  
  if (migrateResult.status !== 0) {
    console.warn('⚠️  Manual migration had issues (non-critical)');
  }
  
  // Step 3: Push schema to database
  console.log('🚀 Pushing schema to database...');
  const pushResult = spawnSync(npxCmd, ['prisma', 'db', 'push', '--accept-data-loss', '--skip-generate'], {
    stdio: 'inherit',
  });

  if (pushResult.status !== 0) {
    console.error('❌ Prisma db push failed! Database schema may be outdated.');
    console.error('⚠️  Application will start but some features may not work.');
  } else {
    console.log('✅ Database schema synchronized successfully');
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
