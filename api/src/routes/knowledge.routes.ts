import { Router } from 'express';
import { KnowledgeController } from '../controllers/knowledge.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const knowledgeController = new KnowledgeController();

router.use(authenticateToken);

router.get('/', knowledgeController.getEntries.bind(knowledgeController));
router.post('/', knowledgeController.createEntry.bind(knowledgeController));

// Fix for frontend 404s - Map specific endpoints to createEntry
// Note: For /upload, we might need multer middleware if it sends a file directly, 
// but if it sends a JSON with file content/url, this works.
router.post('/text', knowledgeController.createEntry.bind(knowledgeController));
router.post('/url', knowledgeController.createEntry.bind(knowledgeController));
router.post('/upload', knowledgeController.createEntry.bind(knowledgeController));

router.post('/reindex', knowledgeController.reindex.bind(knowledgeController));
router.delete('/:id', knowledgeController.deleteEntry.bind(knowledgeController));

export default router;
