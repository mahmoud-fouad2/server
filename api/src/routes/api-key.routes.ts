import { Router } from 'express';
import { listApiKeys, createApiKey, deleteApiKey } from '../controllers/api-key.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', listApiKeys);
router.post('/', createApiKey);
router.delete('/:id', deleteApiKey);

export default router;
