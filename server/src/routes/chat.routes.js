import express from 'express';
const router = express.Router();
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import { validateChatMessage } from '../middleware/validation.js';
import asyncHandler from 'express-async-handler';
import prisma from '../config/database.js';
import * as aiService from '../services/ai.service.js';
import vectorSearch from '../services/vector-search.service.js';

// Import CommonJS modules using dynamic import compatibility
const chatController = await import('../controllers/chat.controller.js');
const responseValidator = (await import('../services/response-validator.service.js')).default;
const logger = (await import('../utils/logger.js')).default;

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
      return res.error('Conversation ID and rating are required', 400);
    }

    if (rating < 1 || rating > 5) {
      return res.error('Rating must be between 1 and 5', 400);
    }

    const conversation = await prisma.conversation.update({ where: { id: conversationId }, data: { rating, feedback: feedback || null, status: 'CLOSED' } });

    res.success(conversation, 'Conversation rated');
  } catch (error) {
    logger.error('Chat rating compatibility handler error', { error });
    res.error('Internal server error', 500, { message: error.message });
  }
});

// ===== Backwards-compatible Conversation Endpoints (merged from conversations.routes.js) =====

// Create conversation (compatibility with older public API used in tests)
router.post('/', async (req, res) => {
  try {
    const { businessId, channel = 'WIDGET' } = req.body;
    if (!businessId) return res.error('businessId required', 400);
    const conv = await prisma.conversation.create({ data: { businessId, channel, status: 'ACTIVE' } });
    res.success(conv, 'Conversation created', 201);
  } catch (err) {
    logger.error('Create conversation (compat) failed', err);
    res.error('Failed to create conversation', 500, { message: err?.message || err });
  }
});

// Post a message to a conversation (compat)
router.post('/:conversationId/messages', async (req, res, next) => {
  try {
    // ensure conversationId is available to controller
    req.body.conversationId = req.params.conversationId;

    // Fetch conversation to validate ownership or businessId
    const conv = await prisma.conversation.findUnique({ where: { id: req.params.conversationId } });
    if (!conv) {
      logger.warn('Conversation not found (compat post message)', { conversationId: req.params.conversationId, headerBusinessId: req.body.businessId || null });
      return res.error('Conversation not found', 404);
    }

    // If Authorization header is present, enforce token validation and ownership
    if (req.headers && req.headers.authorization) {
        try {
          await new Promise((resolve, reject) => authenticateToken(req, res, (err) => err ? reject(err) : resolve()));
        } catch (err) {
          // authenticateToken already sent response; just return
          return;
        }

        if (req.user && conv.businessId !== req.user.businessId) return res.error('Forbidden', 403);
      } else {
      // No auth: require businessId in body to match conversation (widget compatibility)
      if (!req.body.businessId || req.body.businessId !== conv.businessId) {
        return res.error('Forbidden', 403);
      }
    }

    return chatController.sendMessage(req, res, next);
  } catch (err) {
    logger.error('Post message to conversation (compat) failed', err);
    return res.error('Failed to post message', 500, { message: err?.message || err });
  }
});

// NOTE: The single-conversation GET route is intentionally defined after
// more specific admin listing routes to avoid Express matching '/conversations'
// or '/handover-requests' as a conversationId parameter. See below where
// this route is added after the admin endpoints.

// Rate conversation (compat)
router.post('/:conversationId/rate', authenticateToken, (req, res, next) => {
  req.body.conversationId = req.params.conversationId;
  return chatController.submitRating(req, res, next);
});

// Admin / Dashboard routes (require authentication)
router.get('/conversations', authenticateToken, chatController.getConversations);
router.get('/:conversationId/messages', authenticateToken, chatController.getMessages);
router.get('/handover-requests', authenticateToken, chatController.getHandoverRequests);

// Get conversation with messages (specific single conversation)
// This must be after the admin listing routes so Express doesn't treat
// the literal paths '/conversations' or '/handover-requests' as a
// conversationId parameter.
router.get('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.conversationId }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    if (!conversation) {
      logger.warn('Conversation not found (get conversation)', { conversationId: req.params.conversationId, requestingBusinessId: req.user?.businessId });
      return res.error('Conversation not found', 404);
    }
    if (conversation.businessId !== req.user.businessId) return res.error('Forbidden', 403);
    res.success(conversation, 'Conversation fetched');
  } catch (err) {
    logger.error('Get conversation failed', err);
    res.error('Failed to fetch conversation', 500, { message: err?.message || err });
  }
});

// Mark conversation messages as read by business
router.post('/:conversationId/mark-read', authenticateToken, asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;
  const { businessId } = req.user;
  if (!businessId) return res.error('Business ID required', 400);
  await prisma.message.updateMany({ where: { conversationId, role: 'USER', isReadByBusiness: false }, data: { isReadByBusiness: true } });
  res.success(null, 'Marked read');
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

    // Ensure test-ai path is exercised in tests
    const aiResult = await aiService.generateChatResponse(
      message,
      business,
      [],
      knowledgeContext,
      null
    );

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

export default router;
