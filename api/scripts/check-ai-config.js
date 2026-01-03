import prisma from '../dist/config/database.js';

async function checkAIConfig() {
  try {
    const business = await prisma.business.findUnique({
      where: { id: 'cmjx5hz7a000br594zctuurus' },
      select: {
        id: true,
        name: true,
        aiProviderConfig: true,
        customAIModels: true,
      }
    });
    
    console.log('=== Business AI Configuration ===');
    console.log(JSON.stringify(business, null, 2));
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAIConfig();
