const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');

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

    // Fix: Convert relative icon URLs to full URLs
    if (config.customIconUrl && config.customIconUrl.startsWith('/uploads/')) {
       let baseUrl = process.env.CLIENT_URL || process.env.API_URL;
       if (!baseUrl) {
         baseUrl = process.env.NODE_ENV === 'production' 
           ? 'https://faheemly.com' 
           : 'http://localhost:3000';
       }
       baseUrl = baseUrl.replace(/\/$/, '');
       config.customIconUrl = `${baseUrl}${config.customIconUrl}`;
    }

      // Verify the icon actually exists (avoid serving stale/missing uploads)
      if (config.customIconUrl && config.customIconUrl.startsWith('http')) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2000);
          const resp = await fetch(config.customIconUrl, { method: 'HEAD', signal: controller.signal });
          clearTimeout(timeout);
          if (!resp.ok) {
            // Clear invalid URL to fall back to default avatar at client
            config.customIconUrl = null;
          }
        } catch (e) {
          config.customIconUrl = null;
        }
      }

    // Legacy: Replace localhost URLs with current API URL to prevent CSP errors
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
      widgetConfig: config,
      preChatFormEnabled: business.preChatFormEnabled || false
    });
  } catch (error) {
    logger.error('Widget Config Error', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Widget Chat Endpoint (Public) - delegate to central chat controller for unified behavior
const chatController = require('../controllers/chat.controller');
const asyncHandler = require('express-async-handler');

// Rate limiter for public widget chat to prevent abuse and excessive AI calls
const widgetChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/chat', widgetChatLimiter, asyncHandler(chatController.sendMessage));

// Update Widget Config (Authenticated)
router.post('/config', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const widgetConfig = req.body;

    // Validate widget config structure
    if (typeof widgetConfig !== 'object') {
      return res.status(400).json({ error: 'Invalid widget config format' });
    }

    // Update business widget config
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: { widgetConfig: JSON.stringify(widgetConfig) }
    });

    res.json({ 
      message: 'Widget config updated successfully',
      widgetConfig: JSON.parse(updatedBusiness.widgetConfig)
    });
  } catch (error) {
    logger.error('Update Widget Config Error', error);
    res.status(500).json({ error: 'Failed to update widget config' });
  }
});

// Upload Widget Icon (Authenticated)
const storageService = require('../services/storage.service');

router.post('/upload-icon', authenticateToken, upload.single('icon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const businessId = req.user.businessId;

    // If S3 is enabled, upload the saved local file to S3 and remove local copy
    let finalIconUrl = null;
    if (storageService.isS3Enabled()) {
      try {
        finalIconUrl = await storageService.uploadIcon(req.file.path, req.file.filename, req.file.mimetype);
      } catch (e) {
        logger.error('S3 upload failed, falling back to local disk URL', e);
      }
    }

    // If S3 not used or upload failed, use local disk URL
    if (!finalIconUrl) {
      const relativeIconUrl = `/uploads/icons/${req.file.filename}`;
      let baseUrl = process.env.CLIENT_URL || process.env.API_URL;
      if (!baseUrl) {
        baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://faheemly.com' 
          : 'http://localhost:3000';
      }
      baseUrl = baseUrl.replace(/\/$/, '');
      finalIconUrl = `${baseUrl}${relativeIconUrl}`;
    }

    // Update business widget config with new icon URL
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const currentConfig = business.widgetConfig ? JSON.parse(business.widgetConfig) : {};
    currentConfig.customIconUrl = finalIconUrl;

    await prisma.business.update({
      where: { id: businessId },
      data: { widgetConfig: JSON.stringify(currentConfig) }
    });

    // Return the updated config to ensure frontend gets the new icon
    const updatedBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: { widgetConfig: true }
    });

    res.json({ 
      success: true,
      message: 'Icon uploaded successfully',
      iconUrl: finalIconUrl,
      widgetConfig: updatedBusiness?.widgetConfig ? JSON.parse(updatedBusiness.widgetConfig) : currentConfig
    });
  } catch (error) {
    logger.error('Upload Icon Error', error);
    res.status(500).json({ error: 'Failed to upload icon' });
  }
});

module.exports = router;
