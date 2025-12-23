import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const BUSINESS_ID = 'cmivd3c0z0003ulrrn7m1jtjf';

async function main() {
  console.log('🌱 Seeding Analytics Data...');

  // 1. Ensure Business Exists
  let business = await prisma.business.findUnique({
    where: { id: BUSINESS_ID },
  });

  if (!business) {
    console.log('Creating Business...');
    business = await prisma.business.create({
      data: {
        id: BUSINESS_ID,
        name: 'Demo Business',
        email: 'demo@example.com',
        password: 'hashed_password_placeholder', // In real app, hash this
        plan: 'FREE',
      },
    });
  }

  // 2. Create Visitor
  const fingerprint = 'fp_' + Math.random().toString(36).substring(2);
  console.log('Creating Visitor...');
  const visitor = await prisma.visitor.create({
    data: {
      businessId: BUSINESS_ID,
      fingerprint: fingerprint,
      name: 'Test Visitor',
      email: 'visitor@test.com',
    },
  });

  // 3. Create Session
  console.log('Creating Session...');
  const session = await prisma.visitorSession.create({
    data: {
      visitorId: visitor.id,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ipAddress: '127.0.0.1',
      country: 'Egypt',
      city: 'Cairo',
      device: 'Desktop',
      browser: 'Chrome',
      os: 'Windows',
      pageViews: 5,
      duration: 120, // seconds
      lastActive: new Date(),
    },
  });

  // 4. Create Page Views
  console.log('Creating Page Views...');
  const pages = ['/dashboard', '/pricing', '/contact', '/'];
  for (const url of pages) {
    await prisma.pageView.create({
      data: {
        sessionId: session.id,
        url: 'http://localhost:3000' + url,
        title: 'Page ' + url,
        duration: 30,
      },
    });
  }

  console.log('✅ Analytics Data Seeded Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });