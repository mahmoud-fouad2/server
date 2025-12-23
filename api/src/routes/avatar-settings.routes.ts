import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { Response } from 'express';

const router = Router();

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for avatar and icon uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/business/avatar-settings - Save avatar and widget settings
router.post(
  '/avatar-settings',
  authenticateToken,
  upload.fields([
    { name: 'customAvatar', maxCount: 1 },
    { name: 'customIcon', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const businessId = req.user!.businessId;
      if (!businessId) {
        return res.status(400).json({ error: 'Business ID required' });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const {
        selectedAvatar,
        selectedIcon,
        widgetVariant,
        primaryColor,
        secondaryColor,
        accentColor,
        personality,
        position,
        borderRadius,
        welcomeMessage,
        widgetName,
        preChatEnabled,
        notificationSoundEnabled,
        ratingEnabled,
        autoOpenDelay,
        showBranding,
      } = req.body;

      // Get current config
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { widgetConfig: true },
      });

      let currentConfig: any = {};
      try {
        currentConfig = business?.widgetConfig ? JSON.parse(business.widgetConfig) : {};
      } catch (e) {
        currentConfig = {};
      }

      // Build updated config
      const updatedConfig: any = {
        ...currentConfig,
        avatar: selectedAvatar || currentConfig.avatar,
        primaryColor: primaryColor || currentConfig.primaryColor,
        secondaryColor: secondaryColor || currentConfig.secondaryColor,
        accentColor: accentColor || currentConfig.accentColor,
        personality: personality || currentConfig.personality,
        position: position || currentConfig.position,
        borderRadius: borderRadius || currentConfig.borderRadius,
        welcomeMessage: welcomeMessage || currentConfig.welcomeMessage,
        widgetName: widgetName || currentConfig.widgetName,
        preChatEnabled: preChatEnabled === 'true' || preChatEnabled === true,
        notificationSoundEnabled: notificationSoundEnabled === 'true' || notificationSoundEnabled === true,
        ratingEnabled: ratingEnabled === 'true' || ratingEnabled === true,
        autoOpenDelay: parseInt(autoOpenDelay || '0'),
        showBranding: showBranding === 'true' || showBranding === true,
      };

      // Handle custom avatar upload
      if (files?.customAvatar && files.customAvatar[0]) {
        updatedConfig.avatarUrl = `/uploads/${files.customAvatar[0].filename}`;
      }

      // Handle custom icon upload
      if (files?.customIcon && files.customIcon[0]) {
        updatedConfig.customIconUrl = `/uploads/${files.customIcon[0].filename}`;
      }

      // Handle selectedIcon
      if (selectedIcon && selectedIcon !== 'custom') {
        updatedConfig.customLauncherIcon = selectedIcon;
      }

      // Update database
      const updated = await prisma.business.update({
        where: { id: businessId },
        data: {
          widgetConfig: JSON.stringify(updatedConfig),
          widgetVariant: widgetVariant?.toUpperCase() || 'STANDARD',
          ...(primaryColor ? { primaryColor } : {}),
        },
        select: {
          id: true,
          widgetVariant: true,
          widgetConfig: true,
        },
      });

      const configVersion = Date.now();

      res.json({
        success: true,
        businessId: updated.id,
        widgetVariant: updated.widgetVariant,
        widgetConfig: updatedConfig,
        configVersion,
      });
    } catch (error) {
      console.error('Error saving avatar settings:', error);
      res.status(500).json({ 
        error: 'Failed to save settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
