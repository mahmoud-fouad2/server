import { Router } from 'express';
import { VisitorController } from '../controllers/visitor.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import cors from 'cors';

const router = Router();
const visitorController = new VisitorController();

// Enable CORS for widget endpoints
const widgetCors = cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-business-id', 'x-fingerprint'],
  credentials: false,
});

router.post('/session', widgetCors, visitorController.createSession);
router.post('/track', widgetCors, visitorController.trackPage);
router.get('/active-sessions', authenticateToken, visitorController.getActiveSessions.bind(visitorController));
router.get('/analytics', authenticateToken, visitorController.getAnalytics.bind(visitorController));

export default router;
