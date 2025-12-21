import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const chatController = new ChatController();

// Public chat endpoints (protected by rate limit and businessId check, not user auth)
router.post('/send', chatController.sendMessage.bind(chatController));
router.post('/rate', chatController.rateConversation.bind(chatController));

router.get('/conversations', authenticateToken, chatController.getConversations.bind(chatController));
router.get('/conversations/:conversationId/messages', authenticateToken, chatController.getMessages.bind(chatController));
router.post('/conversations/:conversationId/handoff', authenticateToken, chatController.requestHandoff.bind(chatController));
router.get('/conversations/:conversationId/analytics', authenticateToken, chatController.getAnalytics.bind(chatController));

export default router;
