require('dotenv').config();
console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Connected successfully');

    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Query works');

    // Test a simple table query
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5`;
    console.log('✅ Tables found:', result.length);

  } catch (error) {
    console.log('❌ Database error:', error.message);
    console.log('❌ Error code:', error.code);
  } finally {
    await prisma.$disconnect();
    console.log('✅ Disconnected');
  }
}

testConnection();