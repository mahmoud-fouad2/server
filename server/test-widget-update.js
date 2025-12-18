/**
 * Test widget config update - simulates dashboard changes
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = 'postgresql://fahimo_user:ugbqfF41eTQkwCTqYum8wJi9Y3GTh0Fq@dpg-d4ni1bfpm1nc73e7e5gg-a.oregon-postgres.render.com/fahimo?sslmode=require';

const adapter = new PrismaPg({
  connectionString
});

const prisma = new PrismaClient({ adapter });

async function testUpdate() {
  try {
    const businessId = 'cmjbk7fl900016xg0zwv0ztz9';

    console.log('📝 Updating widget config...\n');

    // Simulate dashboard changes
    const newConfig = {
      welcomeMessage: "السلام عليكم 👋 أنا Faheemly AI - هنا أساعدك بكل احترافية!",
      primaryColor: "#FF6B35", // Changed to orange
      personality: "professional",
      showBranding: true,
      avatar: "bot"
    };

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        widgetConfig: JSON.stringify(newConfig)
      },
      select: {
        id: true,
        name: true,
        widgetConfig: true,
        updatedAt: true
      }
    });

    console.log('✅ Config updated successfully!');
    console.log(`   Business: ${updated.name}`);
    console.log(`   Updated at: ${updated.updatedAt}`);
    console.log(`   Config: ${JSON.stringify(JSON.parse(updated.widgetConfig), null, 2)}`);

    // Now test the API picks it up
    console.log('\n🔗 Verifying via API...');
    const response = await fetch('https://fahimo-api.onrender.com/api/widget/config/' + businessId);
    const apiConfig = await response.json();

    if (apiConfig.widgetConfig.primaryColor === '#FF6B35') {
      console.log('✅ API returns the updated config!');
      console.log('   Primary color:', apiConfig.widgetConfig.primaryColor);
      console.log('   Welcome message:', apiConfig.widgetConfig.welcomeMessage);
      console.log('   Config version:', apiConfig.configVersion);
    } else {
      console.log('⚠️  API still returning old config - widget polling will pick it up in 30s');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdate();
