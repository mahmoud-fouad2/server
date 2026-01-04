import { Router, Request, Response } from 'express';
import { systemController } from '../controllers/system.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { authenticateSystemKey } from '../middleware/systemKey.js';
import { Role, PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

router.post(
  '/flush-cache',
  authenticateToken,
  authorizeRole([Role.ADMIN, Role.SUPERADMIN]),
  systemController.flushCache
);

router
  .route('/flush-cache/service')
  .all(authenticateSystemKey)
  .post(systemController.flushCache)
  .get(systemController.flushCache);

// Delete KB entries for cleanup (Protected by secret key)
router.delete('/knowledge-base/:businessId', async (req: Request, res: Response) => {
  try {
    const { secretKey } = req.body;
    const { businessId } = req.params;
    
    const expectedKey = process.env.SEED_SECRET_KEY || 'faheemly-seed-2026';
    if (secretKey !== expectedKey) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Delete all KB and chunks
    await prisma.knowledgeChunk.deleteMany({ where: { businessId } });
    const result = await prisma.knowledgeBase.deleteMany({ where: { businessId } });
    
    logger.info(`🗑️ Deleted ${result.count} KB entries for ${businessId}`);
    res.json({ success: true, deleted: result.count });
  } catch (error: any) {
    logger.error('KB deletion failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Secret endpoint to seed Faheemly Business (Protected by secret key)
router.post('/seed-faheemly', async (req: Request, res: Response) => {
  try {
    const { secretKey, force } = req.body;
    
    // Verify secret key
    const expectedKey = process.env.SEED_SECRET_KEY || 'faheemly-seed-2026';
    if (secretKey !== expectedKey) {
      logger.warn('Unauthorized seed attempt', { ip: req.ip });
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    logger.info('🌱 Starting Faheemly Business seed via API...');
    
    const BUSINESS_ID = 'cmjx5hz7a000br594zctuurus';

    // Update Business Settings
    await prisma.business.update({
      where: { id: BUSINESS_ID },
      data: {
        botTone: 'professional',
        systemPrompt: `أنت مساعد ذكي لمنصة فهملي (Faheemly)، أقوى منصة شات بوت عربية مدعومة بالذكاء الاصطناعي.

**دورك:**
- مساعدة العملاء في فهم خدمات فهملي
- الرد على الاستفسارات بشكل احترافي ودقيق
- توضيح الأسعار والباقات والمميزات

**قواعد:**
1. رد باللهجة المناسبة للعميل
2. استخدم أسلوب احترافي وودود
3. لا تخرج عن سياق فهملي
4. الأسعار: تبدأ من 149 ريال شهرياً`,
        language: 'ar'
      }
    });

    // Check existing KB
    const existingKB = await prisma.knowledgeBase.count({
      where: { businessId: BUSINESS_ID }
    });

    if (existingKB > 0 && !force) {
      return res.json({
        success: true,
        message: 'Business updated. KB already has entries. Use force=true to re-seed.',
        existingEntries: existingKB
      });
    }

    // Delete old KB if force=true
    if (force) {
      await prisma.knowledgeChunk.deleteMany({ where: { businessId: BUSINESS_ID } });
      await prisma.knowledgeBase.deleteMany({ where: { businessId: BUSINESS_ID } });
      logger.info('🗑️ Cleared existing KB');
    }

    // Comprehensive KB entries
    const entries = [
      {
        title: 'عن فهملي - من نحن',
        content: `فهملي (Faheemly) هي أقوى منصة شات بوت عربية مدعومة بالذكاء الاصطناعي تأسست عام 2023.

نخدم الشركات في: السعودية، مصر، الإمارات، الكويت، الأردن، البحرين، وكامل الوطن العربي.

مهمتنا: تحويل طريقة تواصل الشركات العربية مع عملائها عبر أتمتة خدمة العملاء بالذكاء الاصطناعي وزيادة المبيعات.`,
        tags: 'من نحن,عن فهملي,about,who'
      },
      {
        title: 'خدمات فهملي الأساسية',
        content: `نقدم 7 خدمات رئيسية:

1. **شات بوت موقع إلكتروني**: ويدجت ذكي يُدمج في موقعك بكود بسيط
2. **ربط واتساب**: اتصال مباشر بواتساب بيزنس عبر QR Code
3. **تمييز اللهجات**: يفهم 8 لهجات عربية (مصري، سعودي، إماراتي، كويتي، الخ)
4. **تحليل المشاعر**: يكتشف شكاوى العملاء تلقائياً ويستجيب بتعاطف
5. **قاعدة المعرفة**: ارفع ملفات PDF أو نصوص والبوت يتعلم منها
6. **تقارير وإحصائيات**: متابعة أداء البوت والمحادثات
7. **دعم متعدد اللغات**: عربي، إنجليزي، فرنسي`,
        tags: 'خدمات,features,services,مميزات'
      },
      {
        title: 'الأسعار والباقات',
        content: `**باقة البداية (Starter)**: 149 ريال/شهر
- 1000 رسالة شهرياً
- ويدجت واحد
- ربط واتساب
- تمييز اللهجات
- قاعدة معرفة (10 ملفات)

**باقة الأعمال (Business)**: 399 ريال/شهر
- 5000 رسالة شهرياً
- 3 ويدجت
- ربط واتساب متقدم
- تحليل مشاعر متقدم
- قاعدة معرفة (50 ملف)
- تقارير مفصلة

**باقة المؤسسات (Enterprise)**: 999+ ريال/شهر
- رسائل غير محدودة
- ويدجتات غير محدودة
- API مخصص
- دعم فني أولوية
- تخصيص كامل

**تجربة مجانية**: 7 أيام لكل الباقات بدون بطاقة ائتمان`,
        tags: 'أسعار,pricing,باقات,plans,تكلفة'
      },
      {
        title: 'ربط واتساب - خطوات التفعيل',
        content: `خطوات ربط واتساب بيزنس مع فهملي:

1. **اذهب للإعدادات** في لوحة التحكم
2. **اختر "ربط واتساب"**
3. **امسح QR Code** بواتساب بيزنس على هاتفك
4. **انتظر التأكيد** (5-10 ثواني)
5. **اختبر** بإرسال رسالة لرقمك

**متطلبات:**
- واتساب بيزنس (ليس العادي)
- رقم مفعّل ومتصل بالإنترنت
- صلاحيات WhatsApp Business API

**ملاحظة**: الربط مجاني في كل الباقات، ويدعم الردود التلقائية 24/7`,
        tags: 'واتساب,whatsapp,ربط,integration,توصيل'
      },
      {
        title: 'تمييز اللهجات العربية',
        content: `البوت يفهم ويرد بـ 8 لهجات عربية:

1. **المصري**: "عايز، إزيك، مبروك"
2. **السعودي**: "وش، كيفك، مشكور"
3. **الإماراتي**: "شخبارك، عيل، يا الغالي"
4. **الكويتي**: "شلونك، عيل، مشكور"
5. **الخليجي العام**: "شلونكم، مشكورين"
6. **اللبناني/الشامي**: "كيفك، شو، يعني"
7. **المغربي**: "كيف داير، واش"
8. **الفصحى**: لغة رسمية

**كيف يعمل:**
- تحليل الكلمات الدالة (keywords)
- تحديد الموقع الجغرافي (اختياري)
- الرد بنفس اللهجة تلقائياً

**دقة**: 75-85% في التمييز`,
        tags: 'لهجات,dialects,عربي,مصري,سعودي,إماراتي'
      },
      {
        title: 'قاعدة المعرفة - كيفية الاستخدام',
        content: `قاعدة المعرفة تتيح للبوت التعلم من بياناتك:

**أنواع الملفات المدعومة:**
- PDF (حتى 10 MB)
- Word (DOC, DOCX)
- نصوص عادية (TXT)
- روابط مواقع (URLs)

**خطوات الإضافة:**
1. **اذهب لقسم "قاعدة المعرفة"**
2. **اضغط "إضافة معلومة جديدة"**
3. **ارفع ملف أو الصق نص**
4. **اكتب عنوان وصفي**
5. **احفظ** - سيتم معالجة الملف خلال دقيقة

**كيف يستخدمها البوت:**
- يبحث في المعرفة عند كل سؤال
- يعطي إجابات دقيقة من مستنداتك
- يستشهد بالمصدر إذا طلبت

**الحد الأقصى:**
- Starter: 10 ملفات
- Business: 50 ملف
- Enterprise: غير محدود`,
        tags: 'قاعدة المعرفة,knowledge base,رفع ملفات,تعلم,training'
      },
      {
        title: 'الدعم الفني والمساعدة',
        content: `نوفر دعم فني متعدد القنوات:

**قنوات الدعم:**
- **بريد إلكتروني**: support@faheemly.com
- **واتساب**: +966 50 123 4567
- **شات مباشر**: من لوحة التحكم
- **مركز المساعدة**: docs.faheemly.com

**أوقات الاستجابة:**
- Starter: 24-48 ساعة
- Business: 12-24 ساعة
- Enterprise: 1-4 ساعات (دعم أولوية)

**ما نساعد فيه:**
- إعداد الحساب
- ربط واتساب
- تدريب البوت
- حل المشاكل التقنية
- استشارات تحسين الأداء

**لغات الدعم:** عربي، إنجليزي`,
        tags: 'دعم,support,مساعدة,help,تواصل,contact'
      },
      {
        title: 'بدء الاستخدام - دليل سريع',
        content: `ابدأ مع فهملي في 5 خطوات:

**الخطوة 1: التسجيل** (دقيقة واحدة)
- اذهب لـ faheemly.com
- اضغط "جرب مجاناً"
- أدخل بريدك وكلمة مرور

**الخطوة 2: إنشاء بوت** (3 دقائق)
- اختر نوع نشاطك (مطعم، عيادة، متجر، الخ)
- حدد لهجة البوت
- اكتب رسالة ترحيب

**الخطوة 3: إضافة معرفة** (5 دقائق)
- ارفع ملف PDF عن خدماتك
- أو اكتب أسئلة وأجوبة شائعة

**الخطوة 4: التثبيت** (2 دقيقة)
- انسخ كود الويدجت
- الصقه قبل </body> في موقعك
- أو اربط واتساب بـ QR Code

**الخطوة 5: الاختبار** (دقيقة واحدة)
- افتح موقعك
- جرب الشات بوت
- أرسل أسئلة تجريبية

**مجموع الوقت:** 12 دقيقة فقط!`,
        tags: 'بدء,getting started,تسجيل,دليل,tutorial'
      },
      {
        title: 'حالات استخدام فهملي',
        content: `فهملي يخدم 10+ مجالات:

**1. المطاعم والكافيهات**
- حجز طاولات
- عرض القائمة (Menu)
- طلبات توصيل

**2. العيادات الطبية**
- حجز مواعيد
- الرد على أسئلة طبية عامة
- إلغاء/تعديل مواعيد

**3. المتاجر الإلكترونية**
- مساعدة في اختيار المنتجات
- تتبع الطلبات
- سياسة الإرجاع

**4. العقارات**
- عرض عقارات متاحة
- حجز معاينة
- تفاصيل الأسعار

**5. التعليم**
- معلومات عن الدورات
- التسجيل
- الإجابة عن الأسئلة الشائعة

**6. الفنادق والسياحة**
- حجز غرف
- معلومات عن المرافق
- خدمة الغرف

**7. خدمة العملاء**
- دعم فني 24/7
- تذاكر الشكاوى
- متابعة الطلبات

وأكثر من 100 حالة استخدام أخرى!`,
        tags: 'حالات استخدام,use cases,أمثلة,examples,مجالات'
      },
      {
        title: 'الأمان والخصوصية',
        content: `نلتزم بأعلى معايير الأمان:

**حماية البيانات:**
- تشفير SSL/TLS لكل الاتصالات
- تشفير قاعدة البيانات (at-rest)
- نسخ احتياطي يومي

**الامتثال:**
- متوافق مع GDPR (الاتحاد الأوروبي)
- متوافق مع PDPL (السعودية)
- ISO 27001 (قيد التطبيق)

**الخصوصية:**
- لا نبيع بياناتك أبداً
- لا نشارك محادثات العملاء
- يمكنك حذف بياناتك بالكامل

**مصادقة:**
- مصادقة ثنائية (2FA)
- API Keys مشفرة
- أدوار ومسؤوليات (RBAC)

**الاستضافة:**
- سيرفرات في الشرق الأوسط وأوروبا
- Uptime 99.9%
- مراقبة 24/7`,
        tags: 'أمان,security,خصوصية,privacy,حماية,GDPR'
      }
    ];

    let added = 0;
    for (const e of entries) {
      await prisma.knowledgeBase.create({
        data: {
          businessId: BUSINESS_ID,
          title: e.title,
          content: e.content,
          tags: e.tags,
          source: 'manual'
        }
      });
      added++;
    }

    logger.info(`✅ Added ${added} KB entries`);
    res.json({ success: true, message: 'Seeded successfully!', added });

  } catch (error: any) {
    logger.error('Seed failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate embeddings for KB
router.post('/generate-embeddings', async (req: Request, res: Response) => {
  try {
    const { secretKey } = req.body;
    
    if (secretKey !== (process.env.SEED_SECRET_KEY || 'faheemly-seed-2026')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    logger.info('🔄 Starting embedding generation...');
    
    const BUSINESS_ID = 'cmjx5hz7a000br594zctuurus';
    
    // Import embedding service
    const { default: embeddingService } = await import('../services/embedding.service.js');

    // Get KB entries
    const kbEntries = await prisma.knowledgeBase.findMany({
      where: { businessId: BUSINESS_ID },
      select: { id: true, title: true, content: true }
    });

    if (kbEntries.length === 0) {
      return res.json({ success: false, message: 'No KB entries found' });
    }

    // Clear existing chunks
    await prisma.knowledgeChunk.deleteMany({ where: { businessId: BUSINESS_ID } });

    let processed = 0;
    let failed = 0;

    // Process each entry with fallback providers
    for (const kb of kbEntries) {
      try {
        const text = `${kb.title}\n${kb.content}`;
        const chunks = splitText(text, 800);
        
        for (let i = 0; i < chunks.length; i++) {
          let success = false;
          const providers = ['GEMINI', 'VOYAGE']; // Updated for 2026: Gemini primary, Voyage backup
          
          // Try each provider in order until success
          for (const provider of providers) {
            try {
              const { embedding } = await embeddingService.generateEmbedding(chunks[i], provider);
              
              await prisma.knowledgeChunk.create({
                data: {
                  businessId: BUSINESS_ID,
                  knowledgeBaseId: kb.id,
                  content: chunks[i],
                  embedding: JSON.stringify(embedding),
                  metadata: JSON.stringify({ provider, title: kb.title, chunk: i })
                }
              });
              
              processed++;
              success = true;
              await new Promise(r => setTimeout(r, 500)); // Increased delay for rate limiting
              break; // Success! Exit provider loop
            } catch (e: any) {
              logger.warn(`Provider ${provider} failed for chunk ${i}: ${e.message}`);
              await new Promise(r => setTimeout(r, 300)); // Wait before trying next provider
            }
          }
          
          if (!success) {
            failed++;
            logger.error(`All providers failed for chunk ${i} of "${kb.title}"`);
          }
        }
      } catch (e: any) {
        failed++;
      }
    }

    res.json({
      success: true,
      message: 'Embeddings generated',
      processed,
      failed,
      total: processed + failed
    });

  } catch (error: any) {
    logger.error('Embedding generation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function splitText(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?؟]\s+/);
  let current = '';

  for (const s of sentences) {
    if ((current + s).length <= maxLen) {
      current += s + '. ';
    } else {
      if (current) chunks.push(current.trim());
      current = s + '. ';
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text.substring(0, maxLen)];
}

export default router;
