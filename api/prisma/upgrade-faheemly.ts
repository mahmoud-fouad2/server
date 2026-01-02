import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upgradeFaheemly() {
  console.log('⬆️  Upgrading Faheemly account to Enterprise...');

  const user = await prisma.user.findUnique({
    where: { email: 'hello@faheemly.com' },
    include: { businesses: true }
  });

  if (!user || user.businesses.length === 0) {
    console.error('❌ User not found!');
    return;
  }

  const business = user.businesses[0];
  console.log(`Found: ${business.name} (${business.id})`);

  // Upgrade to Enterprise with unlimited messages
  await prisma.business.update({
    where: { id: business.id },
    data: {
      planType: 'ENTERPRISE',
      status: 'ACTIVE',
      messageQuota: 999999999, // Unlimited
      messagesUsed: 0,
      trialEndsAt: null, // No trial, permanent
    },
  });

  console.log('✅ Upgraded to ENTERPRISE plan');
  console.log('✅ Message quota set to unlimited (999,999,999)');
  console.log('✅ Status: ACTIVE');
  
  console.log('\n📊 Business Details:');
  console.log(`   Plan: ENTERPRISE`);
  console.log(`   Messages: UNLIMITED`);
  console.log(`   Status: ACTIVE`);
}

upgradeFaheemly()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
