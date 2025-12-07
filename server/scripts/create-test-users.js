/**
 * ══════════════════════════════════════════════════════════════
 *  CREATE TEST USERS
 *  Creates admin and test client accounts for testing
 * ══════════════════════════════════════════════════════════════
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');
  
  try {
    // Create Admin User
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@faheemly.com' },
      update: {},
      create: {
        email: 'admin@faheemly.com',
        password: adminPassword,
        name: 'System Administrator',
        role: 'SUPERADMIN',
        isActive: true
      }
    });
    
    console.log('✅ Admin created:');
    console.log(`   Email: admin@faheemly.com`);
    console.log(`   Password: Admin@123456`);
    console.log(`   Role: SUPERADMIN\n`);
    
    // Create Test Client
    console.log('Creating test client...');
    const clientPassword = await bcrypt.hash('Client@123456', 10);
    
    const client = await prisma.user.upsert({
      where: { email: 'testclient@example.com' },
      update: {},
      create: {
        email: 'testclient@example.com',
        password: clientPassword,
        name: 'Test Client',
        role: 'CLIENT',
        isActive: true
      }
    });
    
    console.log('✅ Test Client created:');
    console.log(`   Email: testclient@example.com`);
    console.log(`   Password: Client@123456`);
    console.log(`   Role: CLIENT\n`);
    
    // Create Test Business for Client
    console.log('Creating test business...');
    const business = await prisma.business.upsert({
      where: { id: 'test-business-' + client.id },
      update: {},
      create: {
        id: 'test-business-' + client.id,
        userId: client.id,
        name: 'Test Restaurant المطعم التجريبي',
        activityType: 'RESTAURANT',
        language: 'ar',
        status: 'TRIAL',
        planType: 'TRIAL',
        messageQuota: 10000,
        messagesUsed: 0,
        botTone: 'friendly',
        primaryColor: '#6366F1'
      }
    });
    
    console.log('✅ Test Business created:');
    console.log(`   Name: ${business.name}`);
    console.log(`   ID: ${business.id}`);
    console.log(`   Type: ${business.activityType}\n`);
    
    // Add sample knowledge base
    console.log('Adding sample knowledge...');
    await prisma.knowledgeBase.create({
      data: {
        businessId: business.id,
        type: 'TEXT',
        content: `
مرحباً بك في المطعم التجريبي!

أوقات العمل:
- السبت إلى الخميس: من 9 صباحاً حتى 11 مساءً
- الجمعة: من 2 ظهراً حتى 12 منتصف الليل

القائمة:
- وجبات شرقية: كبسة، مندي، برياني
- وجبات غربية: برجر، بيتزا، باستا
- مشروبات: عصائر طازجة، قهوة، شاي

خدمة التوصيل:
- متوفرة في جميع أنحاء المدينة
- مجانية للطلبات فوق 50 ريال
- وقت التوصيل: 30-45 دقيقة

للحجوزات:
- الهاتف: 0501234567
- واتساب: 0501234567
- البريد: info@testrestaurant.com

طرق الدفع:
- نقداً عند الاستلام
- بطاقات الائتمان (فيزا، ماستركارد)
- مدى
- Apple Pay
        `.trim(),
        metadata: JSON.stringify({
          source: 'manual',
          language: 'ar'
        })
      }
    });
    
    console.log('✅ Sample knowledge added\n');
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ALL TEST DATA CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📝 TEST CREDENTIALS:\n');
    console.log('👨‍💼 Admin Account:');
    console.log('   📧 Email: admin@faheemly.com');
    console.log('   🔑 Password: Admin@123456');
    console.log('   🎯 Role: SUPERADMIN\n');
    
    console.log('👤 Client Account:');
    console.log('   📧 Email: testclient@example.com');
    console.log('   🔑 Password: Client@123456');
    console.log('   🎯 Role: CLIENT');
    console.log(`   🏢 Business ID: ${business.id}\n`);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('You can now test the application!');
    console.log('Run: npm run test:comprehensive');
    console.log('═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
