const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { resolveBusinessId } = require('../middleware/businessMiddleware');
const { validateAddTextKnowledge, validateAddUrlKnowledge, validateUpdateKnowledge } = require('../middleware/zodValidation');
const knowledgeController = require('../controllers/knowledge.controller');

// Configure Multer with security limits
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Strict file type validation
    const allowedMimes = ['application/pdf', 'text/plain'];
    const allowedExts = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and TXT files are allowed.'));
    }
  }
});

// Upload Knowledge Base (PDF)
router.post('/upload', authenticateToken, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, knowledgeController.uploadKnowledge);

// Add Text Knowledge
router.post('/text', authenticateToken, resolveBusinessId, validateAddTextKnowledge, knowledgeController.addTextKnowledge);

// Add URL Knowledge with Deep Crawling
router.post('/url', authenticateToken, resolveBusinessId, validateAddUrlKnowledge, knowledgeController.addUrlKnowledge);

// Get All Knowledge
router.get('/', authenticateToken, resolveBusinessId, knowledgeController.getKnowledge);

// Update/Edit Knowledge (TEXT only)
router.put('/:id', authenticateToken, resolveBusinessId, validateUpdateKnowledge, knowledgeController.updateKnowledge);

// Delete Knowledge
router.delete('/:id', authenticateToken, knowledgeController.deleteKnowledge);

// Embed unembedded chunks for a business or specific knowledgeBase
router.post('/chunks/embed', authenticateToken, knowledgeController.embedChunks);
router.post('/reindex', authenticateToken, knowledgeController.reindexEmbeddings);
// Regenerate chunks for existing KB entries that lack chunks
router.post('/regen-chunks', authenticateToken, resolveBusinessId, knowledgeController.regenerateChunks);

module.exports = router;
