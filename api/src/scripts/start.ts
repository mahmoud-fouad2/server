import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runMigrations() {
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  
  console.log('🔄 Starting Prisma migrations...');
  console.log('⚠️  This will reset the database and create fresh schema');
  
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
  
  // Step 2: Force reset and push schema (fresh start)
  console.log('🚀 Resetting database and pushing fresh schema...');
  const pushResult = spawnSync(npxCmd, ['prisma', 'db', 'push', '--force-reset', '--skip-generate'], {
    stdio: 'inherit',
  });

  if (pushResult.status !== 0) {
    console.error('❌ Prisma db push failed!');
    console.error('⚠️  Trying without force reset...');
    
    // Fallback: try without force reset
    const fallbackResult = spawnSync(npxCmd, ['prisma', 'db', 'push', '--accept-data-loss', '--skip-generate'], {
      stdio: 'inherit',
    });
    
    if (fallbackResult.status !== 0) {
      console.error('❌ Database migration failed completely!');
      console.error('⚠️  Application will start but features may not work.');
    } else {
      console.log('✅ Database schema synchronized (fallback mode)');
    }
  } else {
    console.log('✅ Database reset and schema synchronized successfully');
  }
  
  // Step 3: Seed database with initial data
  console.log('🌱 Seeding database...');
  const seedResult = spawnSync(process.execPath, [
    path.resolve(__dirname, 'seed.js')
  ], {
    stdio: 'inherit',
  });
  
  if (seedResult.status !== 0) {
    console.warn('⚠️  Database seed had issues (non-critical)');
  } else {
    console.log('✅ Database seeded successfully');
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
