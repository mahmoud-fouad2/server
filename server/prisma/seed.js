const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create AI Models
  await prisma.aIModel.createMany({
    data: [
      {
        name: 'grok-beta',
        apiKey: 'xai-dummy-key',
        endpoint: 'https://api.x.ai/v1',
        isActive: true
      },
      {
        name: 'llama-3.3-70b-versatile',
        apiKey: 'groq-dummy-key',
        endpoint: 'https://api.groq.com/openai/v1',
        isActive: true
      }
    ],
    skipDuplicates: true
  });

  // Create Demo User
  const email = 'demo@fahimo.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Demo User',
      password: hashedPassword,
      role: 'CLIENT',
      businesses: {
        create: {
          name: 'Demo Business',
          activityType: 'COMPANY',
          planType: 'PRO'
        }
      }
    },
  });

  // Create Super Admin
  const adminEmail = 'admin@faheemly.com';
  const adminPassword = await bcrypt.hash('admin@123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { 
      password: adminPassword,
      role: 'SUPERADMIN'
    },
    create: {
      email: adminEmail,
      name: 'Super Admin',
      password: adminPassword,
      role: 'SUPERADMIN'
    }
  });

  console.log({ user, admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
