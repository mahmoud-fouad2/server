// Do NOT import the Prisma client at module load time — importing
// `src/config/database.js` constructs a PrismaClient which may fail during
// build-time hooks (Prisma v7 can require engine adapter options). We will
// import it lazily only when needed (fallback path below).
let prisma = null;

async function installPgVector() {
  try {
    console.log('Installing pgvector extension...');

    if (process.env.DATABASE_URL) {
      // Use `pg` directly (safer in deploy scripts)
      const { Client } = await import('pg');
      const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
      await client.connect();
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      await client.end();
      console.log('✅ pgvector extension installed successfully (via pg client)');
    } else {
      // Fallback: use the project's prisma instance (useful for local/dev runs)
      await prisma.$queryRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
      console.log('✅ pgvector extension installed successfully (via prisma client)');
    }
  } catch (error) {
    console.error('❌ Failed to install pgvector extension:', error?.message || error);
    // Don't exit, just warn - the app can fall back to keyword search
  } finally {
    // Disconnect prisma if we initialized it as a fallback
    try {
      await prisma.$disconnect();
    } catch (e) {
      // ignore
    }
  }
}

installPgVector();