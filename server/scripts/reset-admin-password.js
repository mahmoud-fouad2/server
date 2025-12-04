/**
 * ═══════════════════════════════════════════════════
 *  Reset Admin Password Script
 * ═══════════════════════════════════════════════════
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const adminEmail = 'admin@faheemly.com';
    const newPassword = 'Doda@55002004'; // Your password

    console.log('\n🔧 Resetting admin password...\n');

    // Check if admin exists
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!admin) {
      console.log('❌ Admin not found! Creating new admin...');
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.create({
        data: {
          email: adminEmail,
          fullName: 'Super Admin',
          password: hashedPassword,
          role: 'SUPERADMIN'
        }
      });
      
      console.log('✅ Admin created successfully!');
    } else {
      console.log('📝 Admin found. Updating password...');
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          role: 'SUPERADMIN' // Ensure SUPERADMIN role
        }
      });
      
      console.log('✅ Password updated successfully!');
    }

    console.log('\n📋 Login credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', newPassword);
    console.log('   Role: SUPERADMIN\n');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resetAdminPassword();
