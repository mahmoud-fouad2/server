const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const { validateChatMessage } = require('../middleware/validation');
const chatController = require('../controllers/chat.controller');
const asyncHandler = require('express-async-handler');
const prisma = require('../config/database');
const aiService = require('../services/ai.service');
const vectorSearch = require('../services/vector-search.service');
const responseValidator = require('../services/response-validator.service');
const logger = require('../utils/logger');

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

// Backwards-compatible endpoint for older clients/tests posting ratings to /api/chat/rating
router.post('/rating', async (req, res) => {
  try {
    const { conversationId, rating, feedback } = req.body;

    if (!conversationId || !rating) {
      return res.status(400).json({ error: 'Conversation ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const conversation = await prisma.conversation.update({ where: { id: conversationId }, data: { rating, feedback: feedback || null, status: 'CLOSED' } });

    res.json({ success: true, conversation });
  } catch (error) {
    logger.error('Chat rating compatibility handler error', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin / Dashboard routes (require authentication)
router.get('/conversations', authenticateToken, chatController.getConversations);
router.get('/:conversationId/messages', authenticateToken, chatController.getMessages);
router.get('/handover-requests', authenticateToken, chatController.getHandoverRequests);
// Mark conversation messages as read by business
router.post('/:conversationId/mark-read', authenticateToken, asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;
  const { businessId } = req.user;
  if (!businessId) return res.status(400).json({ error: 'Business ID required' });
  await prisma.message.updateMany({ where: { conversationId, role: 'USER', isReadByBusiness: false }, data: { isReadByBusiness: true } });
  res.json({ success: true });
}));
router.post('/agent/reply', authenticateToken, chatController.agentReply);
router.post('/reply', authenticateToken, chatController.agentReply); // Alias for /api/chat/reply
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

    // For better parity with the widget flow, include KB/context and use the
    // same `generateChatResponse` path so the test playground mirrors real behavior.
    let knowledgeContext = [];
    try {
      knowledgeContext = await vectorSearch.searchKnowledge(message, business.id, 5);
    } catch (e) {
      logger.warn('Test Chat: knowledge search failed, continuing without KB', { error: e.message });
    }

    // Debug: ensure test-ai path is exercised in tests
    console.log('Test Chat: calling aiService.generateChatResponse');
    const aiResult = await aiService.generateChatResponse(
      message,
      business,
      [],
      knowledgeContext,
      null
    );
    console.log('Test Chat aiResult:', aiResult);

    // Sanitize AI response to remove any provider/model self-identification
    let sanitizedResponse = responseValidator.sanitizeResponse(aiResult?.response || '');

    // If sanitized result is empty, try to extract an answer field if AI returned structured JSON
    if (!sanitizedResponse || typeof sanitizedResponse !== 'string' || sanitizedResponse.trim().length === 0) {
      try {
        const parsed = typeof aiResult.response === 'string' ? JSON.parse(aiResult.response) : aiResult.response;
        if (parsed && (parsed.answer || parsed.answerText || parsed.text)) {
          sanitizedResponse = parsed.answer || parsed.answerText || parsed.text;
        }
      } catch (e) {
        // ignore parse errors and fall back to default greeting below
      }
    }

    console.log('Test Chat sanitizedResponse:', sanitizedResponse);

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
