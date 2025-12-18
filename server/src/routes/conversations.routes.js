import express from 'express';
const router = express.Router();
import prisma from '../config/database.js';
const chatControllerModule = await import('../controllers/chat.controller.js');
const chatController = chatControllerModule?.default || chatControllerModule;
import { authenticateToken } from '../middleware/auth.js';

// Create conversation (compatibility with older public API used in tests)
router.post('/', async (req, res) => {
  try {
    const { businessId, channel = 'WIDGET' } = req.body;
    if (!businessId) return res.status(400).json({ success: false, error: 'businessId required' });
    const conv = await prisma.conversation.create({ data: { businessId, channel, status: 'ACTIVE' } });
    res.status(201).json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create conversation' });
  }
});

// Post a message to a conversation (compat)
router.post('/:conversationId/messages', async (req, res, next) => {
  // ensure conversationId is available to controller
  req.body.conversationId = req.params.conversationId;

  // Fetch conversation to validate ownership or businessId
  const conv = await prisma.conversation.findUnique({ where: { id: req.params.conversationId } });
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' });

  // If Authorization header is present, enforce token validation and ownership
  if (req.headers && req.headers.authorization) {
    try {
      await new Promise((resolve, reject) => authenticateToken(req, res, (err) => err ? reject(err) : resolve()));
    } catch (err) {
      // authenticateToken already sent response; just return
      return;
    }

    if (req.user && conv.businessId !== req.user.businessId) return res.status(403).json({ success: false, error: 'Forbidden' });
  } else {
    // No auth: require businessId in body to match conversation (widget compatibility)
    if (!req.body.businessId || req.body.businessId !== conv.businessId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
  }

  return chatController.sendMessage(req, res, next);
});

// Get conversation with messages
router.get('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.conversationId }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
    if (conversation.businessId !== req.user.businessId) return res.status(403).json({ success: false, error: 'Forbidden' });
    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch conversation' });
  }
});

// Rate conversation (compat)
router.post('/:conversationId/rate', authenticateToken, (req, res, next) => {
  req.body.conversationId = req.params.conversationId;
  return chatController.submitRating(req, res, next);
});

// Backwards compatibility: keep compatibility endpoints above and export default router
export default router; 
