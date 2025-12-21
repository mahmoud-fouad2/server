import { Router } from 'express';
import { VisitorController } from '../controllers/visitor.controller.js';

const router = Router();
const visitorController = new VisitorController();

router.post('/session', visitorController.createSession);
router.post('/track', visitorController.trackPage);
router.get('/active-sessions', visitorController.getActiveSessions);
router.get('/analytics', visitorController.getAnalytics);

export default router;
