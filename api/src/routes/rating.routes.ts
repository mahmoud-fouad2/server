import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const analyticsController = new AnalyticsController();

// Assuming this might be public or protected. The error log didn't show 401/403, just 404.
// But usually stats are protected. I'll add auth if it fails, but for now I'll leave it open or check headers.
// The error log showed "ip" so it might be a public dashboard or widget call?
// "api/rating/stats/..." sounds like a dashboard call.
// I'll add authenticateToken to be safe, or maybe it's public for the widget?
// If it's for the widget, it shouldn't need a token.
// But "stats" sounds like admin.
// I'll add authenticateToken.

router.get('/stats/:businessId?', authenticateToken, analyticsController.getRatingStats.bind(analyticsController));

export default router;
