import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusiness() {
  const business = await prisma.business.findUnique({
    where: { id: 'cmjx5hz7a000br594zctuurus' },
    include: {
      user: {
        select: { email: true, name: true }
      }
    }
  });

  if (business) {
    console.log('✅ Business found:');
    console.log(`   ID: ${business.id}`);
    console.log(`   Name: ${business.name}`);
    console.log(`   Status: ${business.status}`);
    console.log(`   User: ${business.user?.email}`);
    console.log(`   Widget Config: ${business.widgetConfig ? 'Yes' : 'No'}`);
  } else {
    console.log('❌ Business NOT found!');
    console.log('Checking all businesses...');
    const all = await prisma.business.findMany({
      include: {
        user: { select: { email: true } }
      }
    });
    console.log(`Found ${all.length} businesses:`);
    all.forEach(b => {
      console.log(`  - ${b.id} (${b.name}) - ${b.user?.email}`);
    });
  }
}

checkBusiness()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
