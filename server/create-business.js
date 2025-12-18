import prisma from './src/config/database.js';

async function createBusiness() {
  try {
    console.log('Creating business with ID: cmjbhwcae00016wi1d9iaff8p');

    // First create a user
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: '$2a$10$dummy.hash.for.test', // dummy hash
        role: 'CLIENT'
      }
    });

    console.log('Created user:', user.id);

    // Then create the business
    const business = await prisma.business.create({
      data: {
        id: 'cmjbhwcae00016wi1d9iaff8p',
        userId: user.id,
        name: 'Test Business',
        activityType: 'COMPANY',
        planType: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        widgetConfig: JSON.stringify({
          welcomeMessage: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
          primaryColor: "#003366",
          personality: "friendly",
          showBranding: true,
          avatar: "robot"
        })
      }
    });

    console.log('Created business:', business.id);
    console.log('Business created successfully!');

  } catch (error) {
    console.error('Error creating business:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBusiness();