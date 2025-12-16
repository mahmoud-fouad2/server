#!/usr/bin/env node
/**
 * Setup Faheemly Master Demo User
 * Creates the official demo user with:
 * - Unlimited message quota
 * - All features enabled
 * - Fully populated knowledge base
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcryptjs = require('bcryptjs');
const logger = require('../src/utils/logger');

// Setup database connection with adapter
const connectionString = process.env.PGBOUNCER_URL || process.env.DATABASE_URL;
if (!connectionString) {
  logger.error('❌ DATABASE_URL or PGBOUNCER_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg({ pool });
const prisma = new PrismaClient({ adapter });

const DEMO_USER_EMAIL = 'hello@faheemly.com';
const DEMO_USER_PASSWORD = 'FaheemlyDemo2025!';
const DEMO_USER_NAME = 'Faheemly';

// Knowledge base content for Faheemly
const FAHEEMLY_KNOWLEDGE = [
  {
    title: 'من نحن',
    content: `نحن فحيملي - منصة ذكية للتواصل مع العملاء عبر الذكاء الاصطناعي.
    
نقدم حلاً متكاملاً يجمع بين قوة الذكاء الاصطناعي والتواصل الآدمي لتحسين خدمة العملاء والمبيعات.

اسسنا بهدف تمكين الشركات والمتاجر من تقديم خدمة عملاء متميزة وسريعة 24/7.`,
    category: 'about'
  },
  {
    title: 'خدماتنا الرئيسية',
    content: `1. **الدردشة الذكية (Smart Chat Widget)**
   - روبوت ذكي يجيب على أسئلة العملاء تلقائياً
   - يدعم العربية والإنجليزية
   - يتعلم من تفاعلات العملاء

2. **إدارة المحادثات**
   - لوحة تحكم مركزية لجميع محادثات العملاء
   - تكامل مع WhatsApp و Telegram و Twilio
   - نماذج جمع بيانات مخصصة

3. **إدارة العملاء (CRM)**
   - تتبع العملاء المحتملين
   - إدارة المبيعات والعروض
   - تحليل سلوك العملاء

4. **قاعدة المعرفة**
   - إنشاء وتنظيم مقالات الدعم
   - البحث الذكي عن الإجابات
   - تحديث تلقائي بناءً على الاستفسارات`,
    category: 'services'
  },
  {
    title: 'الأسعار والخطط',
    content: `**خطة التجربة المجانية**
   - 1000 رسالة شهرية
   - 1 مستخدم
   - قاعدة معرفة بسيطة
   - 30 يوم

**الخطة الاحترافية**
   - 10,000 رسالة شهرية
   - 5 مستخدمين
   - قاعدة معرفة متقدمة
   - تحليلات مفصلة
   - دعم أولوي
   - 299 ريال سعودي شهرياً

**الخطة المتقدمة**
   - رسائل غير محدودة
   - مستخدمون غير محدودون
   - جميع الميزات
   - تكامل مخصص
   - عرض خاص

اتصل بنا للحصول على عرض خاص لاحتياجاتك.`,
    category: 'pricing'
  },
  {
    title: 'كيفية البدء',
    content: `1. **التسجيل**
   - قم بإنشاء حساب جديد
   - أدخل بيانات نشاطك التجاري

2. **إعداد الويدجت**
   - اختر الألوان والنمط
   - قم بتعديل الرسائل الترحيبية
   - انسخ كود التضمين

3. **تغذية قاعدة المعرفة**
   - أضف المقالات والأسئلة الشائعة
   - صنف المحتوى بالفئات
   - حدّث الإجابات بناءً على التفاعلات

4. **تفعيل التكاملات**
   - ربط WhatsApp
   - ربط Telegram
   - ربط قنوات أخرى

5. **المراقبة والتحسين**
   - راقب التحليلات اليومية
   - حسّن الإجابات الضعيفة
   - استمع لتعليقات العملاء`,
    category: 'onboarding'
  },
  {
    title: 'الأسئلة الشائعة',
    content: `**س: هل يمكنني استخدام فحيملي لأنواع أعمال مختلفة؟**
ج: نعم، تدعم المنصة جميع أنواع الأعمال - المحلات التجارية، المستشفيات، الفنادق، المطاعم، وغيرها.

**س: ما اللغات المدعومة؟**
ج: العربية والإنجليزية بدعم كامل. يمكن إضافة لغات أخرى حسب الطلب.

**س: هل البيانات آمنة؟**
ج: نعم، نستخدم تشفير عالي المستوى وتوافق مع معايير الحماية الدولية.

**س: ما زمن التجاوب؟**
ج: الروبوت يجيب فوراً. فريق الدعم البشري يرد في أقل من ساعة.

**س: هل أحتاج خبرة تقنية؟**
ج: لا، الواجهة سهلة جداً. أي شخص يمكنه استخدامها بدون خبرة تقنية.`,
    category: 'faq'
  },
  {
    title: 'تواصل معنا',
    content: `**البريد الإلكتروني:**
contact@faheemly.com

**الهاتف:**
+966-XX-XXXX-XXXX

**الموقع:**
https://faheemly.com

**ساعات العمل:**
السبت - الخميس: 9 صباحاً - 6 مساءً
الجمعة: مغلق

نحن هنا لمساعدتك! لا تتردد في التواصل معنا بأي سؤال أو استفسار.`,
    category: 'contact'
  }
];

async function setupDemoUser() {
  try {
    logger.info('Starting Faheemly demo user setup...');

    // 1. Create or update user
    const hashedPassword = await bcryptjs.hash(DEMO_USER_PASSWORD, 10);
    
    let user = await prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: DEMO_USER_EMAIL,
          password: hashedPassword,
          name: DEMO_USER_NAME,
          fullName: 'Faheemly Demo',
          role: 'ADMIN',
          isActive: true
        }
      });
      logger.info(`✅ User created: ${DEMO_USER_EMAIL}`);
    } else {
      // Update password if user exists
      user = await prisma.user.update({
        where: { email: DEMO_USER_EMAIL },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });
      logger.info(`✅ User updated: ${DEMO_USER_EMAIL}`);
    }

    // 2. Create or update business
    let business = await prisma.business.findFirst({
      where: { userId: user.id }
    });

    if (!business) {
      business = await prisma.business.create({
        data: {
          userId: user.id,
          name: 'Faheemly - Demo Business',
          activityType: 'SAAS',
          language: 'ar',
          status: 'ACTIVE',
          planType: 'UNLIMITED',
          messageQuota: 999999999, // Unlimited
          messagesUsed: 0,
          botTone: 'professional',
          primaryColor: '#6366F1',
          crmLeadCollectionEnabled: true,
          preChatFormEnabled: true
        }
      });
      logger.info(`✅ Business created: ${business.id}`);
    } else {
      // Update business with unlimited quota
      business = await prisma.business.update({
        where: { id: business.id },
        data: {
          status: 'ACTIVE',
          planType: 'UNLIMITED',
          messageQuota: 999999999,
          messagesUsed: 0,
          crmLeadCollectionEnabled: true,
          preChatFormEnabled: true
        }
      });
      logger.info(`✅ Business updated: ${business.id}`);
    }

    // 3. Clear existing knowledge base
    await prisma.knowledgeBase.deleteMany({
      where: { businessId: business.id }
    });
    logger.info(`✅ Cleared existing knowledge base`);

    // 4. Populate knowledge base
    for (const knowledge of FAHEEMLY_KNOWLEDGE) {
      await prisma.knowledgeBase.create({
        data: {
          businessId: business.id,
          title: knowledge.title,
          content: knowledge.content,
          category: knowledge.category,
          language: 'ar',
          status: 'ACTIVE'
        }
      });
    }
    logger.info(`✅ Knowledge base populated with ${FAHEEMLY_KNOWLEDGE.length} articles`);

    // 5. Ensure CRM features enabled
    await prisma.integration.deleteMany({
      where: { businessId: business.id }
    });
    
    const crm = await prisma.integration.create({
      data: {
        businessId: business.id,
        type: 'CRM',
        name: 'Faheemly CRM',
        status: 'ACTIVE',
        config: JSON.stringify({
          leadTracking: true,
          salesPipeline: true,
          customerSegmentation: true
        })
      }
    });
    logger.info(`✅ CRM integration enabled: ${crm.id}`);

    // Summary
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('✨ FAHEEMLY MASTER DEMO USER SETUP COMPLETE');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('');
    logger.info('📧 Email:       hello@faheemly.com');
    logger.info('🔑 Password:    FaheemlyDemo2025!');
    logger.info(`💼 Business ID: ${business.id}`);
    logger.info('');
    logger.info('✅ Features Enabled:');
    logger.info('   ├─ Unlimited Messages');
    logger.info('   ├─ All AI Models');
    logger.info('   ├─ CRM System');
    logger.info('   ├─ Multi-channel Integration');
    logger.info('   ├─ Advanced Analytics');
    logger.info('   └─ Knowledge Base (6 articles)');
    logger.info('');
    logger.info('📚 Knowledge Base Articles:');
    for (const knowledge of FAHEEMLY_KNOWLEDGE) {
      logger.info(`   ├─ ${knowledge.title}`);
    }
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════');

  } catch (error) {
    logger.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

setupDemoUser().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
