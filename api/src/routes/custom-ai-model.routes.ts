import { Router } from 'express';
import { CustomAIModelController } from '../controllers/custom-ai-model.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const controller = new CustomAIModelController();

router.use(authenticateToken);

router.post('/', controller.create);
router.get('/', controller.list);
router.delete('/:id', controller.delete);

export default router;
