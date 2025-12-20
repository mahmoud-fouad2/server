import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const ticketController = new TicketController();

router.use(authenticateToken);

router.post('/', ticketController.create);
router.get('/', ticketController.getAll);
router.get('/:id', ticketController.getOne);
router.post('/:id/messages', ticketController.addMessage);
router.patch('/:id/status', ticketController.updateStatus);

export default router;
