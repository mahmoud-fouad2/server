import express from 'express';
const router = express.Router();
import asyncHandler from 'express-async-handler';
import { authenticateToken } from '../middleware/auth.js';
const businessController = await import('../controllers/business.controller.js');
import { 
  validateUpdateBusiness, 
  validateUpdateBusinessPlan,
  validatePagination 
} from '../middleware/zodValidation.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Multer for avatar/icon uploads in business settings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/icons';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'icon-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });
// logger intentionally not used in routes; use controller-level logging where required

// Dashboard Routes
router.get('/', authenticateToken, businessController.getSettings);
router.get('/stats', authenticateToken, businessController.getDashboardStats);
router.get('/chart-data', authenticateToken, businessController.getChartData);

// Settings Routes
router.get('/settings', authenticateToken, businessController.getSettings);
router.put('/settings', authenticateToken, validateUpdateBusiness, businessController.updateSettings);

// Pre-chat form settings
router.put('/pre-chat-settings', authenticateToken, asyncHandler(businessController.updatePreChatSettings));

// Plan Routes
router.get('/plan', authenticateToken, businessController.getPlan);
router.put('/plan', authenticateToken, validateUpdateBusinessPlan, businessController.updatePlan);

// Conversations Routes
router.get('/conversations', authenticateToken, validatePagination, businessController.getConversations);
router.get('/conversations/:id', authenticateToken, businessController.getConversationById);

// Integrations Routes
router.get('/integrations', authenticateToken, businessController.getIntegrations);

// Cache control (invalidate cached chat responses for this business)
router.post('/cache/invalidate', authenticateToken, businessController.invalidateCache);

// Demo Business Update (Admin Only)
router.post('/update-demo', authenticateToken, businessController.updateDemoBusiness);

// Update avatar/settings including optional file uploads (fields: customAvatar, customIcon)
router.post('/:businessId/avatar-settings', authenticateToken, upload.fields([{ name: 'customAvatar' }, { name: 'customIcon' }]), businessController.updateAvatarSettings);

// Force bump widget version (updates updatedAt) - useful to trigger refreshes/cache-busts
router.post('/:businessId/bump-widget-version', authenticateToken, businessController.bumpWidgetVersion);

export default router;
