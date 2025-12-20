import { Router } from 'express';
import { BusinessController } from '../controllers/business.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const businessController = new BusinessController();

router.use(authenticateToken); // Protect all routes

router.get('/', businessController.getDetails.bind(businessController));
router.patch('/', businessController.update.bind(businessController));

export default router;
