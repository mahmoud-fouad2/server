const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function createDemoData() {
  console.log('🚀 Creating demo data for Faheem.com...\n');

  try {
    // 1. Create Demo User
    console.log('👤 Creating demo user...');
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    let demoUser = await prisma.user.findUnique({
      where: { email: 'demo@faheemly.com' }
    });

    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@faheemly.com',
          password: hashedPassword,
          name: 'Demo User',
          role: 'CLIENT',
          isActive: true
        }
      });
      console.log('✅ Demo user created:', demoUser.id);
    } else {
      console.log('✅ Demo user already exists:', demoUser.id);
    }

    // 2. Create Demo Business
    console.log('\n🏢 Creating demo business...');
    let demoBusiness = await prisma.business.findFirst({
      where: { userId: demoUser.id }
    });

    if (!demoBusiness) {
      demoBusiness = await prisma.business.create({
        data: {
          userId: demoUser.id,
          name: 'مطعم فهملي التجريبي',
          activityType: 'RESTAURANT',
          language: 'ar',
          status: 'ACTIVE',
          planType: 'PRO',
          botTone: 'friendly',
          primaryColor: '#6366F1',
          messageQuota: 10000,
          messagesUsed: 0,
          widgetConfig: JSON.stringify({
            welcomeMessage: 'أهلاً! كيف أقدر أساعدك اليوم؟',
            personality: 'friendly',
            showBranding: true,
            botName: 'مساعد فهملي',
            dialect: 'sa'
          })
        }
      });
      console.log('✅ Demo business created:', demoBusiness.id);
    } else {
      console.log('✅ Demo business already exists:', demoBusiness.id);
    }

    // 3. Create Knowledge Base
    console.log('\n📚 Creating knowledge base entries...');
    
    const knowledgeData = [
      {
        type: 'TEXT',
        content: `قائمة الطعام:
1. شاورما لحم - 25 ريال
2. شاورما دجاج - 20 ريال
3. برجر لحم فاخر - 30 ريال
4. برجر دجاج - 25 ريال
5. بيتزا مارجريتا - 35 ريال
6. بيتزا بيبروني - 40 ريال
7. سلطة سيزر - 20 ريال
8. عصير برتقال طازج - 12 ريال
9. موهيتو فراولة - 15 ريال
10. كنافة بالقشطة - 18 ريال`,
        metadata: { title: 'قائمة الطعام', source: 'manual', category: 'MENU' }
      },
      {
        type: 'TEXT',
        content: `معلومات المطعم:
- الاسم: مطعم فهملي
- الموقع: شارع التحلية، الرياض
- ساعات العمل: يومياً من 12 ظهراً حتى 12 منتصف الليل
- رقم التواصل: 0501234567
- البريد الإلكتروني: info@faheemly.com
- نوفر خدمة التوصيل عبر تطبيقات الطلبات
- متخصصون في المأكولات العربية والعالمية
- نستخدم مكونات طازجة 100%`,
        metadata: { title: 'معلومات المطعم', source: 'manual', category: 'CONTACT' }
      },
      {
        type: 'TEXT',
        content: `العروض الحالية:
🎉 عرض الوجبة العائلية: 4 شاورما + 2 بيتزا + 4 عصائر = 150 ريال بدلاً من 180 ريال
🍔 عرض البرجر: برجر + بطاطس + مشروب = 40 ريال
🍕 عرض البيتزا الكبيرة: اشتري 2 بيتزا واحصل على الثالثة مجاناً
📱 اطلب عبر التطبيق واحصل على خصم 10%
🚗 توصيل مجاني للطلبات فوق 100 ريال`,
        metadata: { title: 'العروض الحالية', source: 'manual', category: 'PROMOTION' }
      },
      {
        type: 'TEXT',
        content: `سياسة التوصيل:
- رسوم التوصيل: 10 ريال داخل النطاق، 15 ريال خارج النطاق
- التوصيل المجاني للطلبات فوق 100 ريال
- وقت التوصيل المتوقع: 30-45 دقيقة
- نغطي جميع أحياء الرياض الشمالية والوسطى
- يمكنك تتبع طلبك عبر رسالة نصية
- الدفع نقداً أو عبر البطاقة عند الاستلام
- نقبل جميع بطاقات الائتمان`,
        metadata: { title: 'سياسة التوصيل', source: 'manual', category: 'SERVICE' }
      }
    ];

    // Delete old knowledge base entries for demo business
    await prisma.knowledgeBase.deleteMany({
      where: { businessId: demoBusiness.id }
    });
    console.log('🗑️  Cleared old knowledge base entries\n');

    for (const data of knowledgeData) {
      await prisma.knowledgeBase.create({
        data: {
          businessId: demoBusiness.id,
          type: data.type,
          content: data.content,
          metadata: data.metadata
        }
      });
      console.log(`✅ Created: ${data.metadata.title}`);
    }

    // 4. Generate Demo Token
    console.log('\n🔑 Generating demo token...');
    const token = jwt.sign(
      {
        userId: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
        businessId: demoBusiness.id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '365d' } // Valid for 1 year
    );

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Demo Data Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Demo Credentials:');
    console.log('   Email: demo@faheemly.com');
    console.log('   Password: demo123\n');
    console.log('👤 User ID:', demoUser.id);
    console.log('🏢 Business ID:', demoBusiness.id);
    console.log('\n🔑 Demo Token (copy to client localStorage):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('💾 User Object (copy to client localStorage as "user"):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify({
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      businessId: demoBusiness.id
    }, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDemoData()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
