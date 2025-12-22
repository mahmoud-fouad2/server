import { Router } from 'express';
import { VisitorController } from '../controllers/visitor.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const visitorController = new VisitorController();

router.post('/session', visitorController.createSession);
router.post('/track', visitorController.trackPage);
router.get('/active-sessions', authenticateToken, visitorController.getActiveSessions.bind(visitorController));
router.get('/analytics', authenticateToken, visitorController.getAnalytics.bind(visitorController));

export default router;
