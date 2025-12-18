import express from 'express';
const router = express.Router();
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { resolveBusinessId } from '../middleware/businessMiddleware.js';
import attachBusinessId from '../middleware/attachBusinessId.js';
import logger from '../utils/logger.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import * as _nodeFetch from 'node-fetch';
const fetch = _nodeFetch.default || _nodeFetch;

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
router.get('/config/:businessId', attachBusinessId, async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Set cache-busting headers to ensure fresh config on every request
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    let business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    // TEMPORARY: Create test business if it doesn't exist (for demo purposes)
    if (!business && businessId === 'cmjbhwcae00016wi1d9iaff8p') {
      try {
        logger.info('Creating test business for demo:', businessId);
        // Create a dummy user first
        const dummyUser = await prisma.user.create({
          data: {
            name: 'Demo User',
            email: `demo-${Date.now()}@example.com`,
            password: '$2a$10$dummy.hash', // dummy hash
            role: 'CLIENT'
          }
        });

        const newBusiness = await prisma.business.create({
          data: {
            id: businessId,
            userId: dummyUser.id,
            name: 'Demo Business',
            activityType: 'COMPANY',
            planType: 'TRIAL',
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            widgetConfig: JSON.stringify({
              welcomeMessage: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
              primaryColor: "#003366",
              personality: "friendly",
              showBranding: true,
              avatar: "robot"
            })
          }
        });
        logger.info('Created demo business:', newBusiness.id);
        // Continue with the new business
        var business = newBusiness;
      } catch (createError) {
        logger.error('Failed to create demo business:', createError);
        // Fall back to demo config
      }
    }

    if (!business) {
      // Return default config for non-existent businesses (mark as demo to make debugging obvious)
        return res.json({
        name: 'Demo Business',
        widgetConfig: {
          welcomeMessage: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
          primaryColor: "#003366",
          personality: "friendly",
          showBranding: true,
          avatar: "robot"
        },
        widgetVariant: 'standard',
        configVersion: Date.now(),
        isDemo: true
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
       // Prefer serving uploaded icons from the API host (where uploads are stored)
       let baseUrl = process.env.API_URL || process.env.CLIENT_URL;
       if (!baseUrl) {
         baseUrl = process.env.NODE_ENV === 'production' 
           ? 'https://fahimo-api.onrender.com' 
           : 'http://localhost:3001';
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

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json({
      name: business.name,
      businessId: business.id,
      widgetConfig: config,
      preChatFormEnabled: business.preChatFormEnabled || false,
      widgetVariant: (business.widgetVariant || 'STANDARD').toLowerCase(),
      configVersion: business.updatedAt?.getTime() || Date.now(),
      servedAt: Date.now(),
      source: 'database'
    });
  } catch (error) {
    logger.error('Widget Config Error', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Widget Chat Endpoint (Public) - delegate to central chat controller for unified behavior
const chatControllerModule = await import('../controllers/chat.controller.js');
const chatController = chatControllerModule?.default || chatControllerModule;
import asyncHandler from 'express-async-handler';

// Rate limiter for public widget chat to prevent abuse and excessive AI calls
const widgetChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/chat', attachBusinessId, widgetChatLimiter, asyncHandler(chatController.sendMessage));

// Update Widget Config (Authenticated)
router.post('/config', authenticateToken, resolveBusinessId, async (req, res) => {
  try {
    const businessId = req.user.businessId;

    if (!businessId) {
      logger.warn('Update Widget Config: no businessId in user', { user: req.user });
      return res.status(400).json({ error: 'Invalid user session' });
    }

    const widgetConfig = req.body;

    // Validate widget config structure
    if (typeof widgetConfig !== 'object') {
      return res.status(400).json({ error: 'Invalid widget config format' });
    }

    // Ensure the business exists before attempting an update to avoid a Prisma "record not found" error
    const existingBusiness = await prisma.business.findUnique({ where: { id: businessId } });
    if (!existingBusiness) {
      logger.warn('Update Widget Config: business not found', { businessId });
      return res.status(404).json({ error: 'Business not found' });
    }

    // Update business widget config (this will update the updatedAt timestamp automatically)
    logger.info('Update Widget Config requested', { userId: req.user?.userId, businessId, incomingConfig: widgetConfig });
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: { widgetConfig: JSON.stringify(widgetConfig) }
    });

    logger.info('Widget config updated in DB', { businessId: updatedBusiness.id, updatedAt: updatedBusiness.updatedAt });

    // Set cache-busting headers
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const parsedConfig = updatedBusiness.widgetConfig ? JSON.parse(updatedBusiness.widgetConfig) : {};
    // Return the updated config and additional debug fields to help the client verify immediate effect
    res.json({ 
      message: 'Widget config updated successfully',
      businessId: updatedBusiness.id,
      widgetConfig: parsedConfig,
      configVersion: updatedBusiness.updatedAt?.getTime() || Date.now(),
      servedAt: Date.now()
    });
  } catch (error) {
    logger.error('Update Widget Config Error', error);
    res.status(500).json({ error: 'Failed to update widget config' });
  }
});

// Upload Widget Icon (Authenticated)
const storageService = (await import('../services/storage.service.js')).default;

router.post('/upload-icon', authenticateToken, resolveBusinessId, upload.single('icon'), async (req, res) => {
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

    // If S3 not used or upload failed, use local disk URL and prefer API host
    if (!finalIconUrl) {
      const relativeIconUrl = `/uploads/icons/${req.file.filename}`;
      let baseUrl = process.env.API_URL || process.env.CLIENT_URL;
      if (!baseUrl) {
        baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://fahimo-api.onrender.com' 
          : 'http://localhost:3001';
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

// Upload Widget Icon as Data URL (Authenticated)
router.post('/upload-icon-data', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { dataUrl } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return res.status(400).json({ error: 'Invalid data URL' });
    }

    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return res.status(404).json({ error: 'Business not found' });

    const config = business.widgetConfig ? JSON.parse(business.widgetConfig) : {};
    // Store as customIconData so widget can render immediately without external fetch
    config.customIconData = dataUrl;
    // Remove any previous customIconUrl to avoid confusion
    delete config.customIconUrl;

    await prisma.business.update({ where: { id: businessId }, data: { widgetConfig: JSON.stringify(config) } });

    res.json({ success: true, message: 'Icon saved to widget config', widgetConfig: config });
  } catch (err) {
    logger.error('Upload Icon Data Error', err);
    res.status(500).json({ error: 'Failed to save icon data' });
  }
});

// TEMPORARY: Test endpoint to verify deployment
router.get('/test-deploy', (req, res) => {
  res.json({ deployed: true, timestamp: Date.now() });
});
  try {
    const { businessId } = req.params;
    if (!businessId) return res.status(400).json({ error: 'businessId required' });

    try {
      const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true, widgetConfig: true, updatedAt: true, name: true } });
      if (!business) return res.json({ exists: false, businessId });

      return res.json({
        exists: true,
        businessId: business.id,
        hasConfig: !!business.widgetConfig,
        configVersion: business.updatedAt?.getTime() || null,
        name: business.name || null,
        active: typeof business.active === 'boolean' ? business.active : null
      });
    } catch (dbErr) {
      logger.warn('Widget exists check DB error', { error: dbErr.message });
      return res.status(503).json({ error: 'Database temporarily unavailable' });
    }
  } catch (err) {
    logger.error('Widget exists endpoint error', err);
    res.status(500).json({ error: 'Failed to check business' });
  }
});

// System diagnostics endpoint for quick DB availability and Prisma configuration checks (non-sensitive)
router.get('/diag/system', async (req, res) => {
  try {
    const { isPrismaConfigured, warnIfPrismaNotConfigured } = await import('../config/database.js');

    // Non-sensitive info only: whether env is present and a quick connectivity check
    const configured = isPrismaConfigured();
    if (!configured) {
      warnIfPrismaNotConfigured(logger);
      return res.json({ dbConfigured: false, reachable: false, note: 'Prisma DATABASE_URL/PGBOUNCER_URL not configured' });
    }

    // Try a lightweight DB query to confirm reachability
    try {
      const client = prisma;
      await client.$queryRaw`SELECT 1`;
      return res.json({ dbConfigured: true, reachable: true });
    } catch (dbErr) {
      logger.warn('System diag db connectivity failed', { error: dbErr.message });
      return res.status(503).json({ dbConfigured: true, reachable: false, error: dbErr.message });
    }
  } catch (err) {
    logger.error('System diag error', err);
    res.status(500).json({ error: 'Failed to run diagnostics' });
  }
});

export default router;
