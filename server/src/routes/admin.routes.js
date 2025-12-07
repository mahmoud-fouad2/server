const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware to check if user is SUPERADMIN
const isAdmin = async (req, res, next) => {
  if (req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Get Dashboard Stats
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalBusinesses = await prisma.business.count();
    const totalConversations = await prisma.conversation.count();
    const totalMessages = await prisma.message.count();

    res.json({
      totalUsers,
      totalBusinesses,
      totalConversations,
      totalMessages
    });
  } catch (error) {
    logger.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get All Users
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        businesses: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    logger.error('Admin Users Error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get System Settings
router.get('/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    // Convert array to object for easier frontend consumption
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    logger.error('Admin Get Settings Error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update System Settings
router.put('/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const settings = req.body; // Expect { key: value, key2: value2 }
    
    const updates = Object.entries(settings).map(([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    });

    await prisma.$transaction(updates);
    res.json({ success: true });
  } catch (error) {
    logger.error('Admin Update Settings Error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// --- AI Providers Management ---

// Get AI Providers Configuration
router.get('/ai-providers', authenticateToken, isAdmin, async (req, res) => {
  try {
    const providers = [
      {
        id: 'groq',
        name: 'Groq',
        model: 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY ? 'configured' : 'not-configured', // SECURITY: Don't expose actual key
        isActive: true,
        tier: 'Free',
        status: process.env.GROQ_API_KEY ? 'configured' : 'not-configured'
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        model: 'gemini-1.5-flash',
        apiKey: process.env.GEMINI_API_KEY ? 'configured' : 'not-configured', // SECURITY: Don't expose actual key
        isActive: true,
        tier: 'Free',
        status: process.env.GEMINI_API_KEY ? 'configured' : 'not-configured'
      },
      {
        id: 'cerebras',
        name: 'Cerebras AI',
        model: 'llama3.1-8b',
        apiKey: process.env.CEREBRAS_API_KEY ? 'configured' : 'not-configured', // SECURITY: Don't expose actual key
        isActive: true,
        tier: 'Free',
        status: process.env.CEREBRAS_API_KEY ? 'configured' : 'not-configured'
      },
      {
        id: 'deepseek',
        name: 'Deepseek',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY ? 'configured' : 'not-configured', // SECURITY: Don't expose actual key
        isActive: true,
        tier: 'Free',
        status: process.env.DEEPSEEK_API_KEY ? 'configured' : 'not-configured'
      }
    ];
    res.json(providers);
  } catch (error) {
    logger.error('Admin Get AI Providers Error:', error);
    res.status(500).json({ error: 'Failed to fetch AI providers' });
  }
});

// Test AI Provider
router.post('/ai-providers/:id/test', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const aiService = require('../services/aiService');
    
    // Simple test message
    const testMessage = "مرحباً، هل أنت تعمل؟";
    const testBusinessId = req.user.businesses?.[0]?.id;
    
    if (!testBusinessId) {
      return res.status(400).json({ error: 'No business found for testing' });
    }

    const result = await aiService.generateResponse(testMessage, testBusinessId, []);
    
    res.json({
      success: true,
      provider: result.provider,
      response: result.response,
      fromCache: result.fromCache
    });
  } catch (error) {
    logger.error('Admin Test AI Provider Error:', error);
    res.status(500).json({ error: 'Test failed: ' + error.message });
  }
});

// Get AI Usage Statistics
router.get('/ai-stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        messages: true
      }
    });

    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const totalConversations = conversations.length;

    res.json({
      totalConversations,
      totalMessages,
      averageMessagesPerConversation: totalConversations > 0 ? (totalMessages / totalConversations).toFixed(2) : 0,
      period: '30 days'
    });
  } catch (error) {
    logger.error('Admin Get AI Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch AI stats' });
  }
});

// --- System Logs ---

// Get System Logs
router.get('/logs', authenticateToken, isAdmin, async (req, res) => {
  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    logger.error('Admin Get Logs Error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Update Business Plan
router.put('/business/:id/plan', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { planType } = req.body;
    try {
      const business = await prisma.business.update({
        where: { id: req.params.id },
        data: { planType }
      });
      res.json(business);
    } catch (e) {
      logger.error('Admin Update Plan Error:', e);
      if (e && e.code === 'P2025') {
        return res.status(404).json({ error: 'Business not found' });
      }
      res.status(500).json({ error: 'Failed to update plan' });
    }
  } catch (error) {
    logger.error('Admin Update Plan Error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// --- System Monitoring Dashboard ---

// Get System Monitoring Dashboard
router.get('/monitoring', authenticateToken, isAdmin, async (req, res) => {
  try {
    const monitor = require('../utils/monitor');
    const report = await monitor.getSystemReport();
    
    res.json({
      system: report.system,
      business: report.business,
      alerts: report.alerts,
      timestamp: report.generatedAt
    });
  } catch (error) {
    logger.error('Admin Monitoring Error:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring data' });
  }
});

// Clear System Alerts
router.delete('/monitoring/alerts', authenticateToken, isAdmin, async (req, res) => {
  try {
    const monitor = require('../utils/monitor');
    monitor.clearOldAlerts(0); // Clear all alerts
    res.json({ success: true, message: 'Alerts cleared' });
  } catch (error) {
    logger.error('Admin Clear Alerts Error:', error);
    res.status(500).json({ error: 'Failed to clear alerts' });
  }
});

// --- Utility: Run Seeding Script (PROTECTED) ---
// NOTE: This endpoint executes the local prisma seed script. It MUST be protected
// and only accessible by SUPERADMIN. Use with caution on production databases.
router.post('/run-seed', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Load the seed helper and run it
    const seed = require('../../prisma/seed-faheemly');
    if (!seed || typeof seed.seedFaheemly !== 'function') {
      return res.status(500).json({ error: 'Seed script not available' });
    }

    const business = await seed.seedFaheemly();

    res.json({ success: true, message: 'Seed executed', businessId: business?.id || null });
// Update Demo Business for hello@faheemly.com (temporary endpoint)
router.post('/update-demo-business', authenticateToken, async (req, res) => {
  try {
    logger.info('Admin updating demo business...');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'hello@faheemly.com' },
      include: { businesses: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Demo user not found' });
    }

    if (user.businesses.length === 0) {
      return res.status(404).json({ error: 'No business found for demo user' });
    }

    const business = user.businesses[0];

    // Update business with unlimited messages and proper name
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id },
      data: {
        name: 'فهملي - Faheemly',
        messageQuota: 999999, // Unlimited
        messagesUsed: 0,
        planType: 'ENTERPRISE',
        widgetConfig: JSON.stringify({
          welcomeMessage: 'أهلاً بك في فهملي! 👋 هل تبحث عن حل لزيادة مبيعاتك؟',
          personality: 'professional',
          showBranding: true,
          botName: 'مساعد فهملي',
          dialect: 'sa'
        })
      }
    });

    // Clear existing knowledge base
    await prisma.knowledgeBaseEntry.deleteMany({
      where: { businessId: business.id }
    });

    // Add Faheemly knowledge base
    const knowledgeEntries = [
      {
        businessId: business.id,
        type: 'TEXT',
        content: `عن فهملي - Faheemly | منصة الشات بوت الذكية الأولى عربياً

🌟 **نبذة عن فهملي:**
فهملي (Faheemly) هي منصة SaaS متخصصة في بناء وإدارة شات بوتات ذكية بالذكاء الاصطناعي للشركات والأعمال العربية. تم تصميم المنصة لتكون الحل الشامل لأتمتة خدمة العملاء وزيادة المبيعات عبر محادثات طبيعية وذكية.

🎯 **رؤيتنا:**
نسعى لأن نكون المنصة الرائدة في مجال الشات بوتات الذكية في الوطن العربي، من خلال تقديم حلول تقنية متطورة تفهم اللغة العربية والثقافة المحلية بشكل عميق.

💡 **ما يميز فهملي:**
- **100% عربي:** مصمم خصيصاً للغة العربية واللهجات المحلية
- **ذكاء اصطناعي متقدم:** نستخدم أحدث نماذج الـ AI المجانية (DeepSeek, Groq, Cerebras, Gemini)
- **بدون تكاليف AI:** استراتيجية Free Tier تتيح لنا تقديم خدمات بأسعار تنافسية
- **تعمل 24/7:** خدمة عملاء ذكية لا تنام، متاحة على مدار الساعة
- **سهلة الاستخدام:** تنصيب في أقل من 10 دقائق بدون معرفة تقنية
- **متعددة القنوات:** WhatsApp، Telegram، Instagram، موقعك الإلكتروني
- **قاعدة معرفة ذكية:** البوت يتعلم من معلوماتك ومنتجاتك
- **تحليلات مفصلة:** تقارير دقيقة عن سلوك العملاء والأداء

🚀 **كيف نعمل:**
فهملي تستخدم تقنية الذكاء الاصطناعي المتقدمة لفهم استفسارات العملاء والرد عليها بشكل طبيعي وذكي. نقوم بتدريب البوت على معلومات نشاطك التجاري، منتجاتك، خدماتك، والأسئلة الشائعة، لضمان ردود دقيقة ومفيدة.

📊 **إحصائيات فهملي:**
- أكثر من 1000+ نشاط تجاري يثق بنا
- 99.9% وقت تشغيل (Uptime)
- متوسط زمن الرد: أقل من ثانية
- رضا العملاء: 4.8/5 نجوم
- تغطية: 22 دولة عربية`,
        metadata: { title: 'عن فهملي', category: 'عن الشركة', tags: ['فهملي', 'شات بوت', 'ذكاء اصطناعي'] }
      },
      {
        businessId: business.id,
        type: 'TEXT',
        content: `الخدمات الأساسية لفهملي:

🗣️ **شات بوت ذكي بالعربية**
- يفهم اللهجات المختلفة ويرد بشكل طبيعي وسلس
- يتعامل مع الاستفسارات المعقدة بذكاء
- يحفظ سياق المحادثة

📱 **تكامل متعدد القنوات**
- WhatsApp Business API
- Telegram Bot
- Instagram Business
- موقعك الإلكتروني (Widget)
- Facebook Messenger

📊 **لوحة تحكم شاملة**
- مراقبة جميع المحادثات
- إحصائيات مفصلة عن الأداء
- تقارير يومية وشهرية
- إدارة قاعدة المعرفة

🎯 **قاعدة معرفة ذكية**
- تدريب البوت على منتجاتك وخدماتك
- دعم النصوص، الروابط، والملفات
- بحث ذكي في المحتوى
- تحديث تلقائي للمعلومات

⚡ **أداء عالي**
- ردود في أقل من ثانية
- متاح 24/7 بدون توقف
- معالجة ملايين الرسائل شهرياً
- ضمان 99.9% uptime`,
        metadata: { title: 'الخدمات الأساسية', category: 'الخدمات', tags: ['خدمات', 'مميزات', 'تكامل'] }
      },
      {
        businessId: business.id,
        type: 'TEXT',
        content: `الأسعار والخطط - فهملي

💰 **الخطط المتاحة:**

📦 **خطة مجانية** - 0 ريال/شهر
- 100 رسالة شهرياً
- قناة واحدة (موقعك)
- دعم أساسي
- مميزات محدودة

💼 **خطة أساسية** - 199 ريال/شهر
- 1,000 رسالة شهرياً
- قناتان تواصل
- تقارير أساسية
- دعم فني

🚀 **خطة محترفة** - 499 ريال/شهر
- 5,000 رسالة شهرياً
- قنوات غير محدودة
- تقارير متقدمة
- تدريب مخصص
- دعم أولوية

🏢 **خطة شركات** - 999 ريال/شهر
- رسائل غير محدودة
- جميع المميزات المتقدمة
- API مخصص
- مدير حساب خاص
- دعم VIP 24/7

💳 **طرق الدفع:**
- جميع البطاقات الائتمانية
- تحويل بنكي
- مدى
- Apple Pay & Google Pay

📞 **للاستفسارات:**
- واتساب: +966501234567
- إيميل: sales@faheemly.com
- الموقع: www.faheemly.com

🎁 **عروض خاصة:**
- خصم 20% للعام الأول
- استشارة مجانية لإعداد البوت
- تدريب فريقك على الاستخدام`,
        metadata: { title: 'الأسعار والخطط', category: 'الأسعار', tags: ['أسعار', 'خطط', 'اشتراكات'] }
      },
      {
        businessId: business.id,
        type: 'TEXT',
        content: `القطاعات التي نخدمها - فهملي

🍽️ **المطاعم والكافيهات**
- أتمتة الطلبات والحجوزات
- قوائم الطعام الذكية
- خدمة التوصيل
- إدارة الشكاوى

🏥 **العيادات والمستشفيات**
- حجز المواعيد الطبية
- تذكير المرضى
- معلومات الأطباء والخدمات
- استفسارات عامة

🛍️ **التجزئة والمتاجر**
- خدمة عملاء تفاعلية
- معلومات المنتجات والأسعار
- متابعة الطلبات
- توصيات المنتجات

🎓 **المؤسسات التعليمية**
- دعم الطلاب والأولياء
- معلومات البرامج والرسوم
- تسجيل الطلاب
- استفسارات أكاديمية

🏢 **الشركات والمكاتب**
- دعم فني وتقني
- معلومات الخدمات
- توجيه العملاء
- إدارة الشكاوى

💼 **الخدمات المالية**
- استفسارات الحسابات
- معلومات المنتجات المالية
- دعم العملاء
- إرشادات الأمان

🏗️ **العقارات**
- عرض العقارات المتاحة
- جدولة المعاينات
- معلومات الأسعار والموقع
- متابعة العملاء

🚗 **السيارات والنقل**
- حجز الصيانة
- معلومات الأسعار
- خدمة العملاء
- استفسارات عامة

✈️ **السياحة والسفر**
- حجز الرحلات والفنادق
- معلومات الوجهات
- دعم السائحين
- استفسارات الخدمات`,
        metadata: { title: 'القطاعات المدعومة', category: 'القطاعات', tags: ['قطاعات', 'صناعات', 'مجالات'] }
      },
      {
        businessId: business.id,
        type: 'TEXT',
        content: `كيف تبدأ مع فهملي - دليل التنصيب

🚀 **خطوات البدء السريع:**

1️⃣ **التسجيل**
- زور موقعنا www.faheemly.com
- اضغط "ابدأ مجاناً"
- أدخل بياناتك الأساسية

2️⃣ **إعداد البوت**
- اختر نوع نشاطك التجاري
- حدد القطاع واللغة
- اختر خطة الاشتراك

3️⃣ **تدريب البوت**
- أضف معلومات عن شركتك
- أدرج منتجاتك وخدماتك
- أضف الأسئلة الشائعة

4️⃣ **التكامل**
- انسخ كود الـ Widget
- الصقه في موقعك الإلكتروني
- اختبر البوت

5️⃣ **النشر**
- اربط القنوات الأخرى
- ابدأ في استقبال العملاء
- راقب الأداء من لوحة التحكم

⏱️ **الوقت المطلوب:** 10 دقائق فقط!

📞 **هل تحتاج مساعدة؟**
فريق الدعم متاح للمساعدة في أي خطوة
- دردشة مباشرة على الموقع
- واتساب: +966501234567
- إيميل: support@faheemly.com

🎯 **نصائح للنجاح:**
- أضف معلومات شاملة عن خدماتك
- حدث قاعدة المعرفة بانتظام
- راقب إحصائيات الأداء
- تفاعل مع ملاحظات العملاء`,
        metadata: { title: 'كيف تبدأ', category: 'البدء', tags: ['تنصيب', 'إعداد', 'دليل'] }
      }
    ];

    // Insert knowledge base entries
    for (const entry of knowledgeEntries) {
      await prisma.knowledgeBaseEntry.create({
        data: entry
      });
    }

    logger.info(`Updated demo business: ${business.id} with ${knowledgeEntries.length} knowledge entries`);

    res.json({
      success: true,
      message: 'Demo business updated successfully',
      businessId: business.id,
      changes: {
        name: updatedBusiness.name,
        messageQuota: updatedBusiness.messageQuota,
        planType: updatedBusiness.planType,
        knowledgeEntries: knowledgeEntries.length
      }
    });
  } catch (error) {
    logger.error('Admin Update Demo Business Error:', error);
    res.status(500).json({ error: 'Failed to update demo business: ' + (error?.message || error) });
  }
});

module.exports = router;
