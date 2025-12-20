import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const paymentController = new PaymentController();

router.use(authenticateToken);

router.get('/', paymentController.list.bind(paymentController));
router.post('/intent', paymentController.createIntent.bind(paymentController));

export default router;
