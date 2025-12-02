const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get first business
  const business = await prisma.business.findFirst({
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });

  if (business) {
    console.log('\n✅ Business Found:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Business ID: ${business.id}`);
    console.log(`Business Name: ${business.name}`);
    console.log(`Owner: ${business.user.name} (${business.user.email})`);
    console.log(`Activity Type: ${business.activityType}`);
    console.log(`Plan: ${business.planType}`);
    console.log(`Messages Used: ${business.messagesUsed}/${business.messageQuota}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`📋 Widget Code:`);
    console.log(`<script src="http://localhost:3001/fahimo-widget.js" data-business-id="${business.id}"></script>\n`);
    
    console.log(`🔗 Test Widget:`);
    console.log(`http://localhost:3001/test-widget.html?businessId=${business.id}\n`);
  } else {
    console.log('❌ No business found in database');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
