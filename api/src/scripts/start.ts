import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runPrismaGenerate() {
  console.log('📦 Generating Prisma Client...');
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  
  const result = spawnSync(npxCmd, ['prisma', 'generate'], {
    stdio: 'inherit',
  });
  
  if (result.status === 0) {
    console.log('✅ Prisma Client generated successfully');
  } else {
    console.error('❌ Failed to generate Prisma Client');
  }
}

function startServer() {
  console.log('🚀 Starting API server...');
  const indexJs = path.resolve(__dirname, '..', 'index.js');
  
  const result = spawnSync(process.execPath, [indexJs], {
    stdio: 'inherit',
  });

  process.exit(result.status ?? 1);
}

// Simple execution: just generate client and start
runPrismaGenerate();
startServer();
