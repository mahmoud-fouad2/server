import { Router } from 'express';
import { listApiKeys, createApiKey, deleteApiKey } from '../controllers/api-key.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listApiKeys);
router.post('/', createApiKey);
router.delete('/:id', deleteApiKey);

export default router;
