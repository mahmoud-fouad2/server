import { Router } from 'express';
import { IntegrationController } from '../controllers/integration.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const integrationController = new IntegrationController();

router.use(authenticateToken);

router.get('/', integrationController.getAll);
router.post('/telegram', integrationController.updateTelegram);
router.post('/whatsapp', integrationController.updateWhatsApp);
router.delete('/:type', integrationController.remove);

export default router;
