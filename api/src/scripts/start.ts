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

  // Determine which URL to use. 
  // We prefer the standard DATABASE_URL. 
  // Only if it fails repeatedly might we consider alternatives, but usually DATABASE_URL is correct on Render.
  // We REMOVED the forced override of DATABASE_URL_EXTERNAL to avoid confusion.
  
  while (attempts < maxAttempts && !migrationSuccess) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts} to connect and migrate...`);

    // Try 'migrate deploy' first (Production standard)
    // This expects a valid migration history.
    const result = runCommand(npxCmd, ['prisma', 'migrate', 'deploy'], process.env, true);

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
        const pushResult = runCommand(npxCmd, ['prisma', 'db', 'push', '--accept-data-loss'], process.env, true);
        
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
