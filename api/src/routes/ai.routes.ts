import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const aiController = new AIController();

router.use(authenticateToken);

router.get('/models', aiController.listModels.bind(aiController));
router.post('/models', aiController.createModel.bind(aiController));

export default router;
