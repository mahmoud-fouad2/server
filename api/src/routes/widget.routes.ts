import { Router } from 'express';
import { WidgetController } from '../controllers/widget.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const widgetController = new WidgetController();

router.get('/config/:businessId', widgetController.getConfig.bind(widgetController));
router.patch('/config', authenticateToken, widgetController.updateConfig.bind(widgetController));
router.get('/loader.js', widgetController.getLoader.bind(widgetController));
router.get('/subscribe', widgetController.subscribe.bind(widgetController));

export default router;
