import { Router } from 'express';
import { BusinessController } from '../controllers/business.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const businessController = new BusinessController();

router.use(authenticateToken); // Protect all routes

router.get('/', businessController.getDetails.bind(businessController));
router.patch('/', businessController.update.bind(businessController));

// Dashboard endpoints (backward compatible with the web dashboard)
router.get('/stats', businessController.getStats.bind(businessController));
router.get('/settings', businessController.getSettings.bind(businessController));
router.put('/settings', businessController.updateSettings.bind(businessController));
router.put('/plan', businessController.updatePlan.bind(businessController));
router.get('/integrations', businessController.getIntegrations.bind(businessController));
router.get('/chart-data', businessController.getChartData.bind(businessController));
router.get('/conversations', businessController.getConversations.bind(businessController));
router.put('/pre-chat-settings', businessController.updatePreChatSettings.bind(businessController));
router.post('/cache/invalidate', businessController.invalidateCache.bind(businessController));

export default router;
