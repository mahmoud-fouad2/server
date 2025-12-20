import { Router } from 'express';
import { WidgetController } from '../controllers/widget.controller.js';

const router = Router();
const widgetController = new WidgetController();

router.get('/config/:businessId', widgetController.getConfig.bind(widgetController));
router.get('/loader.js', widgetController.getLoader.bind(widgetController));

export default router;
