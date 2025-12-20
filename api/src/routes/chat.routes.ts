import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const chatController = new ChatController();

// Public chat endpoint (usually protected by rate limit and businessId check, not user auth)
router.post('/send', chatController.sendMessage.bind(chatController));

router.get('/conversations', authenticateToken, chatController.getConversations.bind(chatController));
router.get('/conversations/:conversationId/messages', authenticateToken, chatController.getMessages.bind(chatController));

export default router;
