/**
 * Smart setup script: Creates real business for hello@faheemly.com
 * Uses direct DATABASE_URL connection to Render PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = 'postgresql://fahimo_user:ugbqfF41eTQkwCTqYum8wJi9Y3GTh0Fq@dpg-d4ni1bfpm1nc73e7e5gg-a.oregon-postgres.render.com/fahimo?sslmode=require';

const adapter = new PrismaPg({
  connectionString
});

const prisma = new PrismaClient({
  adapter,
  log: ['warn', 'error']
});

async function setupBusiness() {
  try {
    console.log('🔍 Searching for user: hello@faheemly.com');
    
    const user = await prisma.user.findUnique({
      where: { email: 'hello@faheemly.com' },
      include: { businesses: true }
    });

    if (!user) {
      console.error('❌ User hello@faheemly.com not found');
      process.exit(1);
    }

    console.log('✅ Found user:', user.name);
    console.log(`📊 User has ${user.businesses.length} business(es)`);

    if (user.businesses.length > 0) {
      console.log('🎯 Business already exists:');
      user.businesses.forEach((b, i) => {
        console.log(`  ${i + 1}. ID: ${b.id}`);
        console.log(`     Name: ${b.name}`);
        console.log(`     Status: ${b.status}`);
      });
    } else {
      console.log('\n📝 Creating new business for this user...');
      
      const business = await prisma.business.create({
        data: {
          userId: user.id,
          name: 'Faheemly - Main Business',
          activityType: 'COMPANY',
          language: 'ar',
          status: 'ACTIVE',
          planType: 'PROFESSIONAL',
          trialEndsAt: null,
          messageQuota: 5000,
          messagesUsed: 0,
          widgetConfig: JSON.stringify({
            welcomeMessage: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
            primaryColor: "#6366F1",
            personality: "friendly",
            showBranding: true,
            avatar: "robot"
          })
        }
      });

      console.log('✅ Business created successfully!');
      console.log(`\n📌 Business ID: ${business.id}`);
      console.log(`📌 Embed Code:\n<script src="https://fahimo-api.onrender.com/fahimo-widget.js" data-business-id="${business.id}"></script>`);
    }

    // Verify widget config is accessible
    console.log('\n🔗 Testing widget config endpoint...');
    const config = await prisma.business.findUnique({
      where: { id: user.businesses[0]?.id || (await prisma.business.findFirst({ where: { userId: user.id } })).id },
      select: { widgetConfig: true, updatedAt: true }
    });
    
    if (config) {
      console.log('✅ Widget config is accessible');
      console.log(`   Last updated: ${config.updatedAt}`);
    }

    console.log('\n✨ Setup complete! Changes are live.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupBusiness();
