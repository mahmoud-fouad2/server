import { Router } from 'express';
import { VisitorController } from '../controllers/visitor.controller.js';

const router = Router();
const visitorController = new VisitorController();

router.post('/session', visitorController.createSession);
router.post('/track', visitorController.trackPage);

export default router;
