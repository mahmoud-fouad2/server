import { Router } from 'express';
import { KnowledgeController } from '../controllers/knowledge.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const knowledgeController = new KnowledgeController();

router.use(authenticateToken);

router.get('/', knowledgeController.getEntries.bind(knowledgeController));
router.post('/', knowledgeController.createEntry.bind(knowledgeController));
router.delete('/:id', knowledgeController.deleteEntry.bind(knowledgeController));

export default router;
