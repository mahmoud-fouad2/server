import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const analyticsController = new AnalyticsController();

router.use(authenticateToken);

router.get('/dashboard', analyticsController.getDashboard);

export default router;
