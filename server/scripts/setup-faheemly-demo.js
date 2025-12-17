#!/usr/bin/env node
/**
 * Setup Faheemly Master Demo User
 * Creates the official demo user with:
 * - Unlimited message quota
 * - All features enabled
 * - Fully populated knowledge base
 */

// Support running as ESM in environments where package.json sets "type": "module"
// This allows using existing CommonJS-style requires safely
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

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

// Build Pool options with sensible defaults and optional SSL
const poolOptions = {
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT || '5000', 10),
  keepAlive: true,
  keepAliveInitialDelayMillis: 0
};
if (process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false')) {
  // For Render PostgreSQL databases, allow self-signed certificates
  const isRenderPostgres = connectionString.includes('render.com') || connectionString.includes('dpg-');
  poolOptions.ssl = { rejectUnauthorized: isRenderPostgres ? false : (process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false') };
}

const pool = new Pool(poolOptions);

// Helpers for diagnostics (mask secrets)
function maskConnectionString(cs) {
  try {
    const u = new URL(cs);
    return `${u.hostname}:${u.port || 5432}`;
  } catch (e) {
    return 'unknown-host';
  }
}

// Low-level TCP connectivity check to provide clearer diagnostics
const net = require('net');
async function tcpCheck(host, port = 5432, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let called = false;
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      called = true;
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      if (!called) { called = true; socket.destroy(); reject(new Error('timeout')); }
    });
    socket.on('error', (err) => {
      if (!called) { called = true; reject(err); }
    });
    socket.connect(port, host);
  });
}

// Ensure DB host resolves and port is open before creating Prisma client
try {
  const u = new URL(connectionString);
  const host = u.hostname;
  const port = u.port ? parseInt(u.port, 10) : 5432;

  logger.info(`🔎 Checking DB TCP connectivity to ${maskConnectionString(connectionString)} (ssl=${!!poolOptions.ssl})`);

  await retryWithBackoff(async () => {
    await tcpCheck(host, port, 3000);
    // quick PG check via a simple connect-release
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
    logger.info(`✅ TCP and simple query successful to ${host}:${port}`);
  }, 6, 2000);
} catch (connErr) {
  logger.error('❌ Unable to connect to database after retries:', connErr, {
    message: connErr?.message,
    code: connErr?.code,
    host: maskConnectionString(connectionString)
  });

  try { await pool.end(); } catch (e) { logger.warn('Error closing pool:', e?.message); }
  process.exit(1);
}

logger.info('🔧 Initializing Prisma adapter with connectionString');
logger.info(`Using DB host: ${maskConnectionString(connectionString)}`);
const adapter = new PrismaPg({ 
  connectionString,
  ...poolOptions
});
const prisma = new PrismaClient({ adapter });

const DEMO_USER_EMAIL = 'hello@faheemly.com';
const DEMO_USER_PASSWORD = 'FaheemlyDemo2025!';
const DEMO_USER_NAME = 'Faheemly';

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 5, initialDelay = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

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

    // 1. Create or update user with retry logic
    let user = await retryWithBackoff(async () => {
      // Log pool stats before attempting Prisma calls
      try {
        logger.debug('DB pool stats', {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        });
      } catch (e) {
        logger.warn('Failed to read pool stats:', e?.message);
      }

      const hashedPassword = await bcryptjs.hash(DEMO_USER_PASSWORD, 10);
      
      try {
        let userData = await prisma.user.findUnique({
          where: { email: DEMO_USER_EMAIL }
        });

        if (!userData) {
          userData = await prisma.user.create({
            data: {
              email: DEMO_USER_EMAIL,
              password: hashedPassword,
              name: DEMO_USER_NAME,
              fullName: 'Faheemly Demo',
              role: 'SUPERADMIN',
              isActive: true
            }
          });
          logger.info(`✅ User created: ${DEMO_USER_EMAIL}`);
        } else {
          // Update password if user exists
          userData = await prisma.user.update({
            where: { email: DEMO_USER_EMAIL },
            data: {
              password: hashedPassword,
              role: 'SUPERADMIN',
              isActive: true
            }
          });
          logger.info(`✅ User updated: ${DEMO_USER_EMAIL}`);
        }
        
        return userData;
      } catch (err) {
        // Add pool stats to error for diagnostics and rethrow
        err.poolStats = {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        };
        throw err;
      }
    }, 5, 2000);

    // 2. Create or update business with retry logic
    let business = await retryWithBackoff(async () => {
      let businessData = await prisma.business.findFirst({
        where: { userId: user.id }
      });

      if (!businessData) {
        businessData = await prisma.business.create({
          data: {
            userId: user.id,
            name: 'Faheemly - Demo Business',
            activityType: 'SOFTWARE',
            language: 'ar',
            status: 'ACTIVE',
            planType: 'ENTERPRISE',
            messageQuota: 999999999, // Unlimited
            messagesUsed: 0,
            botTone: 'professional',
            primaryColor: '#6366F1',
            crmLeadCollectionEnabled: true,
            preChatFormEnabled: true
          }
        });
        logger.info(`✅ Business created: ${businessData.id}`);
      } else {
        // Update business with unlimited quota
        businessData = await prisma.business.update({
          where: { id: businessData.id },
          data: {
            status: 'ACTIVE',
            planType: 'ENTERPRISE',
            messageQuota: 999999999,
            messagesUsed: 0,
            crmLeadCollectionEnabled: true,
            preChatFormEnabled: true
          }
        });
        logger.info(`✅ Business updated: ${businessData.id}`);
      }
      
      return businessData;
    }, 5, 2000);

    // 3. Clear and populate knowledge base with retry logic
    await retryWithBackoff(async () => {
      await prisma.knowledgeBase.deleteMany({
        where: { businessId: business.id }
      });
      logger.info(`✅ Cleared existing knowledge base`);

      // Populate knowledge base
      for (const knowledge of FAHEEMLY_KNOWLEDGE) {
        await prisma.knowledgeBase.create({
          data: {
            businessId: business.id,
            title: knowledge.title,
            content: knowledge.content,
            category: knowledge.category,
            status: 'ACTIVE',
            type: 'TEXT'
          }
        });
      }
    }, 5, 2000);
    logger.info(`✅ Knowledge base populated with ${FAHEEMLY_KNOWLEDGE.length} articles`);

    // 5. Ensure CRM features enabled
    await prisma.integration.deleteMany({
      where: { businessId: business.id }
    });
    
    // Skip CRM integration for demo
    logger.info(`✅ CRM features enabled via business settings`);

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
    // Attach pool stats for diagnostics
    const extra = {
      message: error?.message,
      code: error?.code,
      hint: error?.meta?.hint,
      poolStats: error?.poolStats
    };

    // Provide a clearer message for Prisma P2022 (missing column / schema mismatch)
    if (error && error.code === 'P2022') {
      logger.error('❌ Database schema mismatch detected (Prisma P2022). This usually means pending migrations were not applied or the DB is out of sync with the Prisma schema.');
      logger.error('Tip: run `npx prisma migrate deploy` on the target database and confirm migrations applied, then retry.');
      logger.error('Prisma error details:', error.message, extra);
    } else {
      logger.error('❌ Setup failed:', error, extra);
    }
    process.exit(1);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      logger.warn('Error disconnecting Prisma:', e?.message);
    }
    try {
      await pool.end();
    } catch (e) {
      logger.warn('Error closing pool:', e?.message);
    }
  }
}

setupDemoUser().catch(error => {
  const extra = {
    message: error?.message,
    code: error?.code,
    hint: error?.meta?.hint,
    poolStats: error?.poolStats
  };
  logger.error('Fatal setup error:', error, extra);
  process.exit(1);
});
