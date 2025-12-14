const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { authenticateToken } = require('../middleware/auth');
const businessController = require('../controllers/business.controller');
const { 
  validateUpdateBusiness, 
  validateUpdateBusinessPlan,
  validatePagination 
} = require('../middleware/zodValidation');
// logger intentionally not used in routes; use controller-level logging where required

// Dashboard Routes
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

module.exports = router;
