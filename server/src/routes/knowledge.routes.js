const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { resolveBusinessId } = require('../middleware/businessMiddleware');
const { validateAddTextKnowledge, validateAddUrlKnowledge, validateUpdateKnowledge } = require('../middleware/zodValidation');
const knowledgeController = require('../controllers/knowledge.controller');
const prisma = require('../config/database');
const vectorSearch = require('../services/vector-search.service');
const knowledgeBaseService = require('../services/knowledge-base.service');
const logger = require('../utils/logger');

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

// ===== Compatibility & Search Endpoints (merged from knowledge-base.routes.js) =====

// POST /api/knowledge - compatibility endpoint for older clients/tests
router.post('/', authenticateToken, resolveBusinessId, async (req, res) => {
  try {
    let businessId = req.businessId || req.user.businessId;

    // Fallback resolution attempts (mirrors previous compat behavior)
    if (!businessId && req.user) {
      const userId = req.user.userId || req.user.id || null;
      if (userId) {
        const ownerBiz = await prisma.business.findFirst({ where: { userId } });
        if (ownerBiz) businessId = ownerBiz.id;
      } else if (req.user.email) {
        const ownerUser = await prisma.user.findUnique({ where: { email: req.user.email }, include: { businesses: true } });
        businessId = ownerUser?.businesses?.[0]?.id || null;
      }
      if (!businessId) {
        const latest = await prisma.business.findFirst({ orderBy: { createdAt: 'desc' } });
        if (latest) businessId = latest.id;
      }
    }

    const { type, content, title } = req.body;
    if (!businessId) return res.error('Business ID missing', 400);
    if (!type || !content) return res.error('type and content are required', 400);

    const kb = await prisma.knowledgeBase.create({ data: { businessId, type: type.toUpperCase(), content, metadata: { title: title || 'Untitled' } } });

    // Kick off async processing (best-effort)
    try { await knowledgeBaseService.processKnowledgeBase(businessId, content, title || 'Untitled', kb.id); } catch (e) { logger.warn('KB processing failed (compat)', e?.message || e); }

    return res.success(kb, 'Knowledge base created', 201);
  } catch (err) {
    logger.error('Knowledge-base compatibility create failed', err);
    return res.error('Failed to create knowledge base', 500, { message: err?.message || err });
  }
});

// GET /api/knowledge/search?q=... - basic search wrapper
router.get('/search', authenticateToken, resolveBusinessId, async (req, res) => {
  try {
    const businessId = req.businessId || req.user.businessId;
    const q = req.query.query || req.query.q || '';
    if (!q) return res.error('query required', 400);
    const results = await vectorSearch.searchKnowledge(businessId, q, 5);
    return res.success(results, 'Search results');
  } catch (err) {
    logger.error('Knowledge base search failed', err);
    return res.error('Search failed', 500, { message: err?.message || err });
  }
});

module.exports = router;
