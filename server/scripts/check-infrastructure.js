const { createClient } = require('redis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

async function checkInfrastructure() {
  console.log('\n🔍 Starting Infrastructure Diagnostic...\n');

  // 1. Check PostgreSQL & pgvector
  console.log('1️⃣  Checking Database & pgvector...');
  try {
    // Check DB Connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ Database Connection: OK');

    // Check pgvector extension
    const vectorCheck = await prisma.$queryRaw`
      SELECT * FROM pg_extension WHERE extname = 'vector'
    `;
    
    if (vectorCheck.length > 0) {
      console.log('   ✅ pgvector Extension: INSTALLED and ACTIVE');
      console.log(`      Version: ${vectorCheck[0].extversion}`);
    } else {
      console.log('   ❌ pgvector Extension: NOT INSTALLED');
      console.log('      Action Required: Run "CREATE EXTENSION vector;" in your database.');
    }
  } catch (error) {
    console.log('   ❌ Database Error:', error.message);
  }

  // 2. Check Redis
  console.log('\n2️⃣  Checking Redis Cache...');
  if (!process.env.REDIS_URL) {
    console.log('   ❌ REDIS_URL not found in .env file');
  } else {
    const client = createClient({ url: process.env.REDIS_URL });
    
    client.on('error', (err) => console.log('   ❌ Redis Client Error:', err.message));

    try {
      await client.connect();
      console.log('   ✅ Redis Connection: SUCCESS');
      
      await client.set('test_key', 'Faheemly is fast');
      const value = await client.get('test_key');
      
      if (value === 'Faheemly is fast') {
        console.log('   ✅ Redis Read/Write: WORKING');
      }
      
      await client.disconnect();
    } catch (error) {
      console.log('   ❌ Redis Connection Failed:', error.message);
    }
  }

  console.log('\n🏁 Diagnostic Complete.\n');
}

checkInfrastructure()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
