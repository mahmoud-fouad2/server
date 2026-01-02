import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sleep(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

function runCommand(command: string, args: string[], env = process.env, ignoreError = false) {
  const cmdStr = `${command} ${args.join(' ')}`;
  console.log(`👉 Executing: ${cmdStr}`);
  
  const result = spawnSync(command, args, { 
    stdio: 'inherit', 
    env,
    shell: process.platform === 'win32' 
  });

  if (result.status !== 0 && !ignoreError) {
    console.error(`❌ Command failed: ${cmdStr}`);
  }
  
  return result;
}

function runMigrations() {
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  
  console.log('🔄 Starting deployment process...');
  
  // Step 1: Generate Prisma Client
  console.log('📦 Generating Prisma Client...');
  runCommand(npxCmd, ['prisma', 'generate']);
  
  // Step 2: Apply Migrations with Retry Logic
  console.log('🚀 Applying database migrations...');
  
  let attempts = 0;
  const maxAttempts = 5;
  let migrationSuccess = false;

  // CRITICAL FIX: Use DATABASE_URL_EXTERNAL if available for migrations
  // This is needed because Render's internal hostname may not be accessible during build
  const migrationEnv = { ...process.env };
  if (process.env.DATABASE_URL_EXTERNAL) {
    console.log('🔗 Using DATABASE_URL_EXTERNAL for migration...');
    migrationEnv.DATABASE_URL = process.env.DATABASE_URL_EXTERNAL;
  } else {
    console.log('⚠️ DATABASE_URL_EXTERNAL not set, using standard DATABASE_URL');
  }
  
  while (attempts < maxAttempts && !migrationSuccess) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts} to connect and migrate...`);

    // Try 'migrate deploy' first (Production standard)
    // This expects a valid migration history.
    const result = runCommand(npxCmd, ['prisma', 'migrate', 'deploy'], migrationEnv, true);

    if (result.status === 0) {
      migrationSuccess = true;
      console.log('✅ Migrations applied successfully.');
    } else {
      console.warn(`⚠️ Migration attempt ${attempts} failed.`);
      
      // Check if we should retry (e.g. connection error)
      if (attempts < maxAttempts) {
        console.log('⏳ Waiting 5 seconds before retrying...');
        sleep(5000);
      } else {
        console.error('❌ All migration attempts failed.');
        
        // Fallback: Try 'db push' if migrate deploy failed (e.g. drift or no history)
        // But ONLY if we are desperate.
        console.log('⚠️ Attempting `db push` as a fallback (schema sync)...');
        const pushResult = runCommand(npxCmd, ['prisma', 'db', 'push', '--accept-data-loss'], migrationEnv, true);
        
        if (pushResult.status === 0) {
          console.log('✅ Database schema pushed successfully (fallback).');
          migrationSuccess = true;
        }
      }
    }
  }
  
  // Step 3: Seed database
  if (migrationSuccess) {
    console.log('🌱 Seeding database...');
    runCommand(process.execPath, [path.resolve(__dirname, 'seed.js')], process.env, true);
  } else {
    console.warn('⚠️ Skipping seed due to migration failure.');
  }
}

function startServer() {
  console.log('🏁 Starting API server...');
  const indexJs = path.resolve(__dirname, '..', 'index.js');
  
  const result = spawnSync(process.execPath, [indexJs], {
    stdio: 'inherit',
    env: process.env
  });

  process.exit(result.status ?? 1);
}

// Main execution
try {
  runMigrations();
} catch (error) {
  console.error('❌ Unexpected error during migration:', error);
} finally {
  // Always try to start the server, even if migrations failed
  startServer();
}
