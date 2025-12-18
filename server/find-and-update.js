import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = 'postgresql://fahimo_user:ugbqfF41eTQkwCTqYum8wJi9Y3GTh0Fq@dpg-d4ni1bfpm1nc73e7e5gg-a.oregon-postgres.render.com/fahimo?sslmode=require';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function findBusinesses() {
  try {
    // Find hello@faheemly.com
    const user = await prisma.user.findUnique({
      where: { email: 'hello@faheemly.com' }
    });

    if (user) {
      const businesses = await prisma.business.findMany({
        where: { userId: user.id }
      });

      console.log('User businesses:');
      businesses.forEach(b => {
        console.log(`- ID: ${b.id}`);
        console.log(`  Name: ${b.name}`);
      });

      if (businesses.length > 0) {
        // Test updating the first one
        const bId = businesses[0].id;
        console.log(`\nUpdating business: ${bId}...`);

        const updated = await prisma.business.update({
          where: { id: bId },
          data: {
            widgetConfig: JSON.stringify({
              welcomeMessage: "السلام عليكم 👋 مرحباً بك في Faheemly",
              primaryColor: "#FF6B35",
              personality: "professional",
              showBranding: true
            })
          }
        });

        console.log('✅ Updated:', updated.id);
        console.log('Time:', updated.updatedAt);
      }
    }
  } catch (e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

findBusinesses();
