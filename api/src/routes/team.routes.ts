import { Router } from 'express';
import { TeamController } from '../controllers/team.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const teamController = new TeamController();

router.use(authenticateToken);

router.get('/', teamController.getAll);
router.post('/', teamController.create);
router.delete('/:id', teamController.delete);

export default router;
