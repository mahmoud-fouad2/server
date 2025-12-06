const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const logger = require('../utils/logger');

// Simple widget config endpoint
// GET /api/widget/config/:id
router.get('/config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Widget/business id required' });

    // Try to resolve business by id
    const business = await prisma.business.findUnique({ where: { id } });
    if (!business) return res.status(404).json({ error: 'Business not found' });

    // Minimal config returned to widget
    const config = {
      id: business.id,
      name: business.name || 'Unknown',
      locale: business.locale || 'en',
      timezone: business.timezone || 'UTC',
      // Expose widget-specific flags if present in metadata
      widget: (business.metadata && business.metadata.widget) || { enabled: true }
    };

    res.json({ config });
  } catch (err) {
    logger.error('Widget config error', err);
    res.status(500).json({ error: 'Failed to fetch widget config' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
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

    const iconUrl = `http://localhost:3001/uploads/icons/${req.file.filename}`;
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

module.exports = router;
