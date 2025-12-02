// Quick script to create a business for existing user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUser() {
  const userId = 'cmih3lgms0001m5nbw3qkmcph';
  
  // Check if user has a business
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { businesses: true }
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  if (user.businesses.length > 0) {
    console.log('✅ User already has a business:', user.businesses[0].id);
    return;
  }

  // Create a business for this user
  const business = await prisma.business.create({
    data: {
      userId: userId,
      name: `${user.name}'s Business`,
      activityType: 'OTHER',
      planType: 'TRIAL'
    }
  });

  console.log('✅ Business created:', business.id);
  console.log('Now logout and login again!');
}

fixUser()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
