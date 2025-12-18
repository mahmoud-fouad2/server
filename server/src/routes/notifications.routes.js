import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth.js';
const notificationsController = await import('../controllers/notifications.controller.js');

router.get('/unread-count', authenticateToken, notificationsController.getUnreadCount);
router.get('/', authenticateToken, notificationsController.listNotifications);
router.post('/:id/mark-read', authenticateToken, notificationsController.markAsRead);
router.post('/mark-all-read', authenticateToken, notificationsController.markAllRead);

export default router;
