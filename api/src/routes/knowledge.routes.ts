import { Router } from 'express';
import { KnowledgeController } from '../controllers/knowledge.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const knowledgeController = new KnowledgeController();

router.use(authenticateToken);

router.get('/', knowledgeController.getEntries.bind(knowledgeController));
router.post('/', knowledgeController.createEntry.bind(knowledgeController));

// New endpoints for different knowledge import methods
router.post('/text', knowledgeController.createFromText.bind(knowledgeController));
router.post('/url', knowledgeController.createFromUrl.bind(knowledgeController));

// Multer for upload
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });
router.post('/upload', upload.single('file'), knowledgeController.uploadFile.bind(knowledgeController));

router.post('/reindex', knowledgeController.reindex.bind(knowledgeController));
router.delete('/:id', knowledgeController.deleteEntry.bind(knowledgeController));

export default router;
