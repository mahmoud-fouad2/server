import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const businessId = 'cmjx5hz7a000br594zctuurus';
  console.log(`Checking for business with ID: ${businessId}`);

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (business) {
      console.log('✅ Business found:', business.name);
    } else {
      console.log('❌ Business NOT found!');
      
      // List all businesses to see what's available
      const allBusinesses = await prisma.business.findMany({
        select: { id: true, name: true }
      });
      console.log('Available businesses:', allBusinesses);
    }
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();