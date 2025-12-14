const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware to check if user is SUPERADMIN
const isAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Temporary Fix Route (Restricted to SUPERADMIN for emergency use only)
router.get('/fix-my-account-please', authenticateToken, isAdmin, async (req, res) => {
  try {
    const email = 'hello@faheemly.com';
    const user = await prisma.user.findUnique({
      where: { email },
      include: { businesses: true }
    });

    if (!user || user.businesses.length === 0) {
      return res.status(404).json({ error: 'User or business not found' });
    }

    const business = user.businesses[0];

    // 1. Update Quota
    await prisma.business.update({
      where: { id: business.id },
      data: {
        messageQuota: 10000000,
        planType: 'ENTERPRISE',
        status: 'ACTIVE'
      }
    });

    // 2. Seed Knowledge Base (Professional & Comprehensive)
    const knowledgeEntries = [
      // --- التعريف والرؤية ---
      {
        title: 'ما هو فهملي؟',
        content: 'فهملي هو الموظف الرقمي الذكي الأول من نوعه في الشرق الأوسط. ليس مجرد "شات بوت" تقليدي، بل هو نظام ذكاء اصطناعي متكامل يفهم السياق، المشاعر، واللهجات العربية المتعددة (السعودية، المصرية، الخليجية، الشامية، والمغاربية). يهدف فهملي لأتمتة خدمة العملاء والمبيعات بنسبة تصل إلى 80%، مما يتيح لك التركيز على نمو أعمالك.',
        type: 'TEXT',
        tags: ['about', 'vision', 'intro']
      },
      {
        title: 'لماذا أختار فهملي عن غيره؟',
        content: 'يتميز فهملي بـ 3 نقاط قوة حصرية:\n1. **الذكاء اللغوي العربي:** يفهم "أبغى أحجز"، "عاوز أطلب"، "بدي موعد" بنفس الدقة.\n2. **التكامل العميق:** يرتبط مع أنظمتك (Salla, Zid, Shopify, WooCommerce) لقراءة المنتجات وحالة الطلبات تلقائياً.\n3. **التعلم المستمر:** كلما تحدث مع عملائك أكثر، أصبح أذكى في الردود.',
        type: 'TEXT',
        tags: ['features', 'comparison']
      },

      // --- الباقات والأسعار ---
      {
        title: 'تفاصيل باقة البداية (Start)',
        content: 'مثالية للمتاجر الناشئة والعيادات الصغيرة.\n- السعر: 199 ريال/شهر.\n- المميزات: 1,000 محادثة ذكية، بوت واحد، ردود جاهزة، لوحة تحكم أساسية، ودعم فني عبر البريد.',
        type: 'TEXT',
        tags: ['pricing', 'plans', 'start']
      },
      {
        title: 'تفاصيل باقة النمو (Growth)',
        content: 'الأكثر مبيعاً للشركات المتوسطة.\n- السعر: 399 ريال/شهر.\n- المميزات: 5,000 محادثة، 3 بوتات، ربط واتساب رسمي (API)، إزالة شعار فهملي، تقارير متقدمة، وربط مع زد وسلة.',
        type: 'TEXT',
        tags: ['pricing', 'plans', 'growth']
      },
      {
        title: 'تفاصيل باقة الشركات (Enterprise)',
        content: 'للشركات الكبرى والمؤسسات الحكومية.\n- السعر: حسب الطلب.\n- المميزات: محادثات غير محدودة، تدريب مخصص للذكاء الاصطناعي على بياناتك الخاصة، مدير حساب مخصص، ربط API خاص، ونشر على السيرفرات الخاصة (On-Premise).',
        type: 'TEXT',
        tags: ['pricing', 'plans', 'enterprise']
      },

      // --- المميزات التقنية ---
      {
        title: 'كيف يعمل الربط مع واتساب؟',
        content: 'نستخدم واجهة برمجة تطبيقات واتساب للأعمال (WhatsApp Business API) الرسمية. هذا يضمن:\n1. توثيق الحساب بالعلامة الخضراء (Green Tick) إذا كنت مؤهلاً.\n2. عدم الحظر (Anti-Ban).\n3. إمكانية إرسال حملات تسويقية لآلاف العملاء بضغطة زر.',
        type: 'TEXT',
        tags: ['whatsapp', 'technical', 'integration']
      },
      {
        title: 'هل بياناتي آمنة؟',
        content: 'الأمان هو أولويتنا القصوى. جميع البيانات مشفرة باستخدام بروتوكول AES-256. نحن نلتزم بمعايير حماية البيانات السعودية (NDMO) والأوروبية (GDPR). لا نشارك بيانات عملائك مع أي طرف ثالث.',
        type: 'TEXT',
        tags: ['security', 'privacy', 'data']
      },
      {
        title: 'تحليل المشاعر (Sentiment Analysis)',
        content: 'فهملي يستطيع استشعار غضب العميل أو رضاه من خلال سياق الكلام. إذا اكتشف البوت أن العميل غاضب، يقوم فوراً بتغيير نبرة الحديث للاعتذار والتعاطف، أو يقوم بتحويل المحادثة لموظف بشري لامتصاص الغضب.',
        type: 'TEXT',
        tags: ['features', 'ai', 'sentiment']
      },

      // --- حالات الاستخدام (Use Cases) ---
      {
        title: 'فهملي للمتاجر الإلكترونية',
        content: 'يساعدك فهملي في:\n- الرد على استفسارات "وين طلبي؟" تلقائياً.\n- استعادة السلات المتروكة (Abandoned Carts).\n- اقتراح منتجات بديلة (Upselling).\n- الرد على أسئلة المقاسات والشحن.',
        type: 'TEXT',
        tags: ['ecommerce', 'use-cases']
      },
      {
        title: 'فهملي للعيادات والمراكز الطبية',
        content: 'يقوم البوت بـ:\n- حجز المواعيد وتأكيدها تلقائياً.\n- الرد على استفسارات الأسعار والخدمات.\n- إرسال تذكير بالمواعيد عبر واتساب.\n- الإجابة على الأسئلة الطبية العامة (بناءً على تدريبك).',
        type: 'TEXT',
        tags: ['healthcare', 'use-cases']
      },
      {
        title: 'فهملي للمطاعم والكافيهات',
        content: 'يمكن للعملاء:\n- تصفح المنيو بالصور داخل الشات.\n- إجراء طلبات التوصيل أو الاستلام.\n- حجز الطاولات.\n- تقديم الشكاوى والمقترحات.',
        type: 'TEXT',
        tags: ['restaurants', 'use-cases']
      },

      // --- الدعم والتدريب ---
      {
        title: 'كيف أدرب البوت على معلوماتي؟',
        content: 'الأمر بسيط جداً! يمكنك تدريب البوت بـ 3 طرق:\n1. **النصوص:** اكتب المعلومات مباشرة في لوحة التحكم.\n2. **الروابط:** ضع رابط موقعك وسيقوم البوت بقراءته بالكامل.\n3. **الملفات:** ارفع ملفات PDF أو Word تحتوي على سياساتك ومنتجاتك.',
        type: 'TEXT',
        tags: ['training', 'howto', 'ai']
      },
      {
        title: 'سياسة الاسترجاع',
        content: 'نضمن لك استرجاع كامل المبلغ خلال 14 يوماً من الاشتراك في حال لم يحقق فهملي توقعاتك، بشرط عدم تجاوز 10% من رصيد الرسائل.',
        type: 'TEXT',
        tags: ['refund', 'policy']
      }
    ];

    let addedCount = 0;
    for (const entry of knowledgeEntries) {
      const existing = await prisma.knowledgeBase.findFirst({
        where: {
          businessId: business.id,
          title: entry.title
        }
      });

      if (!existing) {
        await prisma.knowledgeBase.create({
          data: {
            businessId: business.id,
            title: entry.title,
            content: entry.content,
            type: entry.type,
            metadata: { tags: entry.tags }
          }
        });
        addedCount++;
      }
    }

    res.json({ 
      success: true, 
      message: `Account updated: Quota set to 10M, ${addedCount} knowledge entries added.` 
    });

  } catch (error) {
    logger.error('Fix Account Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// isAdmin middleware defined above

// Get Dashboard Stats (Enhanced)
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const [
      totalUsers,
      activeUsers,
      totalBusinesses,
      activeBusinesses,
      totalConversations,
      recentConversations,
      totalMessages,
      recentMessages,
      totalKnowledgeBase,
      businessesByPlan
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { isActive: true, deletedAt: null } }),
      prisma.business.count(),
      prisma.business.count({ where: { status: 'ACTIVE' } }),
      prisma.conversation.count(),
      prisma.conversation.count({ where: { createdAt: { gte: since } } }),
      prisma.message.count(),
      prisma.message.count({ where: { createdAt: { gte: since } } }),
      prisma.knowledgeBase.count(),
      prisma.business.groupBy({
        by: ['planType'],
        _count: { id: true }
      })
    ]);

    // Calculate quota usage statistics
    const businessesWithQuota = await prisma.business.findMany({
      select: {
        messageQuota: true,
        messagesUsed: true
      }
    });

    const totalQuota = businessesWithQuota.reduce((sum, b) => sum + (b.messageQuota || 0), 0);
    const totalUsed = businessesWithQuota.reduce((sum, b) => sum + (b.messagesUsed || 0), 0);
    const quotaUsagePercentage = totalQuota > 0 ? Math.round((totalUsed / totalQuota) * 100) : 0;

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      businesses: {
        total: totalBusinesses,
        active: activeBusinesses,
        byPlan: businessesByPlan.reduce((acc, item) => {
          acc[item.planType] = item._count.id;
          return acc;
        }, {})
      },
      conversations: {
        total: totalConversations,
        recent: recentConversations,
        period: `${days} days`
      },
      messages: {
        total: totalMessages,
        recent: recentMessages,
        period: `${days} days`
      },
      knowledgeBase: {
        total: totalKnowledgeBase
      },
      quota: {
        total: totalQuota,
        used: totalUsed,
        remaining: totalQuota - totalUsed,
        usagePercentage: quotaUsagePercentage
      }
    });
  } catch (error) {
    logger.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get All Users (Enhanced with pagination and filtering)
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(role && { role }),
      ...(status === 'active' && { isActive: true }),
      ...(status === 'inactive' && { isActive: false })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          businesses: {
            select: {
              id: true,
              name: true,
              status: true,
              planType: true
            }
          },
          _count: {
            select: {
              businesses: true,
              sessions: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
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

// Alias for ai-models
router.get('/ai-models', authenticateToken, isAdmin, async (req, res) => {
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
        id: 'deepseek',
        name: 'DeepSeek',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY ? 'configured' : 'not-configured', // SECURITY: Don't expose actual key
        isActive: true,
        tier: 'Free',
        status: process.env.DEEPSEEK_API_KEY ? 'configured' : 'not-configured'
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
    ];
    res.json(providers);
  } catch (error) {
    logger.error('Admin Get AI Models Error:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
});

// Add/Update AI Model
router.post('/ai-models', authenticateToken, isAdmin, async (req, res) => {
  try {
    // For now, just log and return success
    logger.info('AI Model update requested:', req.body);
    res.json({ success: true, message: 'AI model configuration updated' });
  } catch (error) {
    logger.error('Admin Update AI Model Error:', error);
    res.status(500).json({ error: 'Failed to update AI model' });
  }
});

// Test AI Provider
router.post('/ai-providers/:id/test', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const aiService = require('../services/ai.service');

    // Simple test message
    const testMessage = "مرحباً، هل أنت تعمل؟";
    const testBusinessId = req.user.businesses?.[0]?.id;

    if (!testBusinessId) {
      return res.status(400).json({ error: 'No business found for testing' });
    }

    const providerKey = id?.toUpperCase();
    const messages = [
      { role: 'system', content: 'You are the official Faheemly assistant. Keep replies short.' },
      { role: 'user', content: testMessage }
    ];

    const result = await aiService.generateResponseWithProvider(providerKey, messages);
    const responseValidator = require('../services/response-validator.service');
    const sanitized = responseValidator.sanitizeResponse(result.response || '');
    
    res.json({
      success: true,
      provider: result.provider || providerKey,
      response: sanitized,
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
  } catch (error) {
    logger.error('Run Seed Error:', error);
    res.status(500).json({ error: 'Failed to run seed: ' + (error?.message || error) });
  }
});

// Update Demo Business for hello@faheemly.com (temporary endpoint)
router.post('/update-demo-business', authenticateToken, isAdmin, async (req, res) => {
  try {
    logger.info('Updating demo business...');

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
        messageQuota: 999999,
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

    // Add basic knowledge base
    const knowledgeEntries = [
      {
        businessId: business.id,
        type: 'TEXT',
        content: 'فهملي هي منصة الشات بوت الذكية الأولى عربياً',
        metadata: { title: 'عن فهملي', category: 'عن الشركة' }
      }
    ];

    await prisma.knowledgeBaseEntry.createMany({
      data: knowledgeEntries
    });

    logger.info(`Updated demo business: ${business.id}`);

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
    logger.error('Update Demo Business Error:', error);
    res.status(500).json({ error: 'Failed to update demo business: ' + (error?.message || error) });
  }
});

module.exports = router;
