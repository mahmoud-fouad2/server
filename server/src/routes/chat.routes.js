const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const { validateRating, validateChatMessage } = require('../middleware/validation');
const chatController = require('../controllers/chat.controller');

// Rate limiter for public chat endpoint
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  message: 'Too many messages from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for pre-chat endpoints
const preChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes per IP
  message: 'Too many pre-chat requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Check if pre-chat form is required
router.get('/pre-chat/:businessId', preChatLimiter, chatController.getPreChatForm);

// Submit pre-chat form data
router.post('/pre-chat/:businessId', preChatLimiter, chatController.submitPreChatForm);

router.post('/message', chatLimiter, validateChatMessage, chatController.sendMessage);

// Admin / Dashboard routes (require authentication)
router.get('/conversations', authenticateToken, chatController.getConversations);
router.get('/:conversationId/messages', authenticateToken, chatController.getMessages);
router.get('/handover-requests', authenticateToken, chatController.getHandoverRequests);
router.post('/agent/reply', authenticateToken, chatController.agentReply);
router.post('/:conversationId/rate', authenticateToken, chatController.submitRating);

// Test endpoint for widget/examples page
router.post('/test', chatLimiter, async (req, res) => {
  try {
    const { message, businessId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use default business if not provided
    let business;
    if (businessId) {
      business = await prisma.business.findUnique({ where: { id: businessId } });
    } else {
      business = await prisma.business.findFirst();
    }

    if (!business) {
      return res.status(404).json({ error: 'No business found' });
    }

    // Simple AI response for testing
    const aiResponse = await aiService.generateResponse(
      [{ role: 'user', content: message }]
    );

    // Sanitize AI response to remove any provider/model self-identification
    const sanitizedResponse = responseValidator.sanitizeResponse(aiResponse?.response || '');

    res.json({
      response: sanitizedResponse || 'مرحباً! كيف يمكنني مساعدتك؟',
      businessId: business.id
    });

  } catch (error) {
    logger.error('Test Chat Error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      response: 'عذراً، حدث خطأ. حاول مرة أخرى.'
    });
  }
});

module.exports = router;
