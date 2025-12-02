const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('Users:', users);

    if (users.length > 0) {
      // Create a business for the first user
      const business = await prisma.business.create({
        data: {
          userId: users[0].id,
          name: `${users[0].name}'s Business`,
          activityType: 'OTHER',
          planType: 'TRIAL',
          messageQuota: 2000,
          messagesUsed: 0
        }
      });
      console.log('Created business:', business.id);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();