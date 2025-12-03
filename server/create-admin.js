const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
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

    console.log('✅ Admin created successfully:', admin);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
