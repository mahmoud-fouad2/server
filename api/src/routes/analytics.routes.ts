import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authenticateToken);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/dashboard/:days', analyticsController.getDashboard);
router.get('/realtime', analyticsController.getRealtime);
router.get('/vector-stats', analyticsController.getVectorStats);

export default router;
