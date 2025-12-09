const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Temporary Fix Route (Public for one-time use)
router.get('/fix-my-account-please', async (req, res) => {
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

    // 2. Seed Knowledge Base
    const knowledgeEntries = [
      {
        title: 'ما هو فهملي؟',
        content: 'فهملي هو منصة شات بوت ذكي متقدمة مصممة خصيصاً للسوق العربي. نحن نستخدم الذكاء الاصطناعي لفهم اللهجات العربية المختلفة (السعودية، المصرية، الخليجية، الشامية) والرد على العملاء بشكل طبيعي وتلقائي على مدار 24 ساعة.',
        type: 'TEXT',
        tags: ['about', 'general']
      },
      {
        title: 'أسعار الباقات',
        content: 'نقدم 3 باقات رئيسية:\n1. باقة البداية (99 ريال/شهر): تشمل 1000 رسالة، بوت واحد، ودعم أساسي.\n2. باقة النمو (299 ريال/شهر): تشمل 5000 رسالة، 3 بوتات، وربط واتساب.\n3. باقة الشركات (تواصل معنا): رسائل غير محدودة، تدريب مخصص، وربط مع أنظمتك الخاصة.',
        type: 'TEXT',
        tags: ['pricing', 'plans']
      },
      {
        title: 'كيفية الاشتراك',
        content: 'يمكنك الاشتراك بسهولة عبر موقعنا faheemly.com. اختر الباقة المناسبة، سجل حسابك، وقم بربط الواتساب الخاص بك في دقائق معدودة.',
        type: 'TEXT',
        tags: ['signup', 'howto']
      },
      {
        title: 'هل يدعم اللهجات العامية؟',
        content: 'نعم، فهملي متميز في فهم اللهجات العامية العربية. سواء كان عميلك يتحدث بالسعودي "أبغى أحجز"، أو بالمصري "عايز أطلب"، أو بالكويتي "ابي موعد"، سيفهمه البوت ويرد عليه باللهجة المناسبة.',
        type: 'TEXT',
        tags: ['dialects', 'features']
      },
      {
        title: 'الدعم الفني',
        content: 'فريق الدعم الفني متاح لمساعدتك عبر البريد الإلكتروني support@faheemly.com أو عبر الشات المباشر في لوحة التحكم.',
        type: 'TEXT',
        tags: ['support', 'contact']
      },
      {
        title: 'مميزات فهملي',
        content: 'أهم المميزات:\n- رد آلي فوري 24/7\n- فهم اللهجات العربية\n- ربط سهل مع واتساب وتيليجرام\n- لوحة تحكم عربية بالكامل\n- تقارير وإحصائيات مفصلة\n- إمكانية تحويل المحادثة لموظف بشري عند الحاجة.',
        type: 'TEXT',
        tags: ['features']
      }
    ];

    let addedCount = 0;
    for (const entry of knowledgeEntries) {
      const existing = await prisma.knowledgeBase.findFirst({
        where: {
          businessId: business.id,
          question: entry.title
        }
      });

      if (!existing) {
        await prisma.knowledgeBase.create({
          data: {
            businessId: business.id,
            question: entry.title,
            content: entry.content,
            type: entry.type,
            tags: entry.tags
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
    
    res.json({
      success: true,
      provider: result.provider || providerKey,
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
  } catch (error) {
    logger.error('Run Seed Error:', error);
    res.status(500).json({ error: 'Failed to run seed: ' + (error?.message || error) });
  }
});

// Update Demo Business for hello@faheemly.com (temporary endpoint)
router.post('/update-demo-business', authenticateToken, async (req, res) => {
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
