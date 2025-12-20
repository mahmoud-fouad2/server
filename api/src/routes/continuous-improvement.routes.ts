import { Router } from 'express';
import { ContinuousImprovementController } from '../controllers/continuous-improvement.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const controller = new ContinuousImprovementController();

router.use(authenticateToken);

router.get('/gaps', controller.getGaps);
router.get('/suggestions', controller.getSuggestions);

export default router;
