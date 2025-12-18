import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';

// Multer config: keep small limits for security tests
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const original = file.originalname || '';
    // Reject filenames containing traversal sequences or path separators
    if (original.includes('..') || original.includes('/') || original.includes('\\')) {
      return cb(new Error('Invalid filename'));
    }

    const ext = path.extname(original).toLowerCase();
    // Reject dangerous executable/script types
    const disallowedExts = ['.php', '.phtml', '.pl', '.py', '.sh', '.exe', '.dll', '.js', '.jsp'];
    if (disallowedExts.includes(ext)) return cb(new Error('Invalid file type'));

    // Accept common safe types
    const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.txt', '.pdf'];
    if (!allowedExts.includes(ext)) return cb(new Error('Invalid file type'));

    cb(null, true);
  }
});

// POST /api/uploads
router.post('/', authenticateToken, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err && err instanceof multer.MulterError) {
      // File too large
      return res.status(413).json({ success: false, error: err.message });
    } else if (err) {
      // Security-related errors map to 400 by default
      if (err.message && err.message.toLowerCase().includes('invalid')) return res.status(400).json({ success: false, error: err.message });
      return res.status(400).json({ success: false, error: 'Upload failed' });
    }

    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    // For tests we won't move files to persistent storage; return safe metadata
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({ success: true, filename: req.file.originalname, url: fileUrl });
  });
});

export default router;
