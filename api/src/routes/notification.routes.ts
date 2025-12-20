import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const notificationController = new NotificationController();

router.use(authenticateToken);

router.get('/', notificationController.list.bind(notificationController));
router.patch('/:id/read', notificationController.markRead.bind(notificationController));

export default router;
