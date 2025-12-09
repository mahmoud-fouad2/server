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
       const baseUrl = process.env.API_URL || 'https://fahimo-api.onrender.com';
       config.customIconUrl = config.customIconUrl.replace(/http:\/\/localhost:\d+/, baseUrl);
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

// Upload Custom Icon (Protected)
router.post('/upload-icon', authenticateToken, upload.single('icon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const baseUrl = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
    // Force HTTPS in production
    const finalBaseUrl = (process.env.NODE_ENV === 'production' && !baseUrl.startsWith('https')) 
      ? baseUrl.replace('http:', 'https:') 
      : baseUrl;
      
    const iconUrl = `${finalBaseUrl}/uploads/icons/${req.file.filename}`;
    res.json({ url: iconUrl });
  } catch (error) {
    console.error('Icon Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload icon' });
  }
});

// Update Widget Config (Protected)
router.post('/config', authenticateToken, async (req, res) => {
  try {
    const { welcomeMessage, primaryColor, personality, showBranding, avatar, customIconUrl } = req.body;
    const businessId = req.user.businessId;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID missing. Please re-login.' });
    }

    // Check if business exists
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return res.status(404).json({ error: 'Business not found. Please contact support.' });
    }

    const config = {
      welcomeMessage,
      primaryColor,
      personality,
      showBranding,
      avatar,
      customIconUrl
    };

    await prisma.business.update({
      where: { id: businessId },
      data: {
        widgetConfig: JSON.stringify(config)
      }
    });

    res.json({ message: 'Widget configuration updated', config });
  } catch (error) {
    console.error('Widget Update Error:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// Widget Chat Endpoint (Public) - Forwards to chat/message
router.post('/chat', async (req, res) => {
  try {
    const { businessId, message, conversationId, sessionId } = req.body;

    if (!message || !businessId) {
      return res.status(400).json({ error: 'Message and Business ID are required' });
    }

    // Import chat logic (simple forward for now)
    const chatRoutes = require('./chat.routes');
    // Since it's the same app, we can simulate the request
    // For simplicity, duplicate the logic or call the handler

    // Temporarily duplicate the validation and business check from chat.routes.js
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Create a mock req object for the chat handler
    const mockReq = {
      body: { message, businessId, conversationId, sessionId },
      ip: req.ip,
      headers: req.headers
    };

    // Call the chat message handler logic (simplified)
    // Since we can't easily call the handler, duplicate the core logic
    const visitorSession = require('../services/visitor-session.service');
    const redisCache = require('../services/cache.service');
    const groqService = require('../services/groq.service');
    const vectorSearch = require('../services/vector-search.service');
    const responseValidator = require('../services/response-validator.service');
    const logger = require('../utils/logger');

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    }
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          businessId,
          channel: 'WIDGET',
          status: 'ACTIVE'
        }
      });
    }

    // Save User Message
    await prisma.message.create({
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

    // Generate response
    const aiResult = await groqService.generateChatResponse(
      message,
      business,
      history.reverse().map(msg => ({
        role: msg.role === 'USER' ? 'user' : 'assistant',
        content: msg.content
      })),
      []
    );

    // Save AI Message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: aiResult.response,
        tokensUsed: aiResult.tokensUsed || 0,
        wasFromCache: false,
        aiModel: aiResult.model || 'groq-llama'
      }
    });

    // Cache
    await redisCache.set(businessId, message, aiResult, 7 * 24 * 60 * 60);

    res.json({
      response: aiResult.response,
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
