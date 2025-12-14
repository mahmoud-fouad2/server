const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const notificationsController = require('../controllers/notifications.controller');

router.get('/unread-count', authenticateToken, notificationsController.getUnreadCount);
router.get('/', authenticateToken, notificationsController.listNotifications);
router.post('/:id/mark-read', authenticateToken, notificationsController.markAsRead);
router.post('/mark-all-read', authenticateToken, notificationsController.markAllRead);

module.exports = router;
