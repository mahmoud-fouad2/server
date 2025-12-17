// Do NOT import the Prisma client at module load time — importing
// `src/config/database.js` constructs a PrismaClient which may fail during
// build-time hooks (Prisma v7 can require engine adapter options). We will
// import it lazily only when needed (fallback path below).
let prisma = null;

async function installPgVector() {
  try {
    console.log('Installing pgvector extension...');
    console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);

    if (process.env.DATABASE_URL) {
      // Use `pg` directly (safer in deploy scripts)
      const { Client } = await import('pg');
      const client = new Client({ 
        connectionString: process.env.DATABASE_URL, 
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false 
      });
      
      console.log('Connecting to database...');
      await client.connect();
      console.log('Connected successfully');
      
      console.log('Creating pgvector extension...');
      await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
      console.log('Extension created');
      
      console.log('Verifying extension...');
      const result = await client.query("SELECT * FROM pg_extension WHERE extname = 'vector';");
      console.log('Extension check result:', result.rows);
      
      await client.end();
      console.log('✅ pgvector extension installed and verified successfully (via pg client)');
    } else {
      console.error('❌ DATABASE_URL not set, cannot install pgvector');
      throw new Error('DATABASE_URL environment variable is required');
    }
  } catch (error) {
    console.error('❌ Failed to install pgvector extension:', error?.message || error);
    throw error; // Re-throw to make the script fail
  } finally {
    // Disconnect prisma if we initialized it as a fallback
    try {
      if (prisma) {
        await prisma.$disconnect();
      }
    } catch (e) {
      // ignore
    }
  }
}

installPgVector().catch(() => process.exit(1));