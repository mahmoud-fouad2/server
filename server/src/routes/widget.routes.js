const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for Icon Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/icons';
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'icon-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  }
});

// Get Widget Config (Public)
router.get('/config/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      // Return default config for non-existent businesses
      return res.json({
        name: 'Demo Business',
        widgetConfig: {
          welcomeMessage: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
          primaryColor: "#003366",
          personality: "friendly",
          showBranding: true,
          avatar: "robot"
        }
      });
    }

    // Default config if none exists
    const defaultConfig = {
      welcomeMessage: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
      primaryColor: "#003366",
      personality: "friendly", // friendly, formal, fun
      showBranding: true,
      avatar: "robot"
    };

    const config = business.widgetConfig ? JSON.parse(business.widgetConfig) : defaultConfig;

    // Fix: Replace localhost URLs with current API URL to prevent CSP errors
    if (config.customIconUrl && config.customIconUrl.includes('localhost')) {
       let baseUrl = process.env.API_URL;
       if (!baseUrl) {
         baseUrl = process.env.NODE_ENV === 'production' 
           ? 'https://fahimo-api.onrender.com' 
           : 'http://localhost:3001';
       }
       baseUrl = baseUrl.replace(/\/$/, '');
       
       // Replace both http and https localhost references
       config.customIconUrl = config.customIconUrl.replace(/https?:\/\/localhost:\d+/, baseUrl);
    }

    res.json({
      name: business.name,
      widgetConfig: config
    });
  } catch (error) {
    console.error('Widget Config Error:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Widget Chat Endpoint (Public) - delegate to central chat controller for unified behavior
const chatController = require('../controllers/chat.controller');
router.post('/chat', chatController.sendMessage);
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message
      }
    });

    // Check cache
    const cachedResponse = await redisCache.get(businessId, message);
    if (cachedResponse) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: cachedResponse.response.response || cachedResponse.response,
          tokensUsed: 0,
          wasFromCache: true,
          aiModel: 'cached'
        }
      });
      return res.json({
        response: cachedResponse.response.response || cachedResponse.response,
        conversationId: conversation.id,
        fromCache: true,
        tokensUsed: 0,
        model: 'redis-cache'
      });
    }

    // Get history
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Use Vector Search to fetch relevant knowledge chunks (same as chat.routes)
    let knowledgeContext = [];
    try {
      knowledgeContext = await vectorSearch.searchKnowledge(message, businessId, 3);
      console.log(`[Widget] 📚 Found ${knowledgeContext.length} relevant knowledge chunks`);
    } catch (vectorError) {
      console.warn('[Widget] Vector search failed, falling back to recent knowledge:', vectorError.message || vectorError);
      const fallbackKnowledge = await prisma.knowledgeBase.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 2
      });
      knowledgeContext = fallbackKnowledge;
    }

    // Prepare history for the chat call
    const formattedHistory = history.reverse().map(msg => ({
      role: msg.role === 'USER' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Generate response with knowledge context
    const aiResult = await groqService.generateChatResponse(
      message,
      business,
      formattedHistory,
      knowledgeContext
    );

    // Sanitize response to remove provider/model signatures
    const sanitized = responseValidator.sanitizeResponse(aiResult.response || '');

    // Save AI Message (store sanitized response)
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: sanitized,
        tokensUsed: aiResult.tokensUsed || 0,
        wasFromCache: false,
        aiModel: aiResult.model || 'groq-llama'
      }
    });

    // Cache sanitized result
    const cachePayload = { ...aiResult, response: sanitized };
    await redisCache.set(businessId, message, cachePayload, 7 * 24 * 60 * 60);

    res.json({
      response: sanitized,
      conversationId: conversation.id,
      fromCache: false,
      tokensUsed: aiResult.tokensUsed,
      model: aiResult.model
    });

  } catch (error) {
    logger.error('Widget Chat Error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

module.exports = router;
