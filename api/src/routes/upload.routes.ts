import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs';

const router = Router();

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const original = file.originalname || '';
    if (original.includes('..') || original.includes('/') || original.includes('\\')) {
      return cb(new Error('Invalid filename'));
    }
    const ext = path.extname(original).toLowerCase();
    const allowedExts = ['.png', '.jpg', '.jpeg', '.gif', '.txt', '.pdf'];
    if (!allowedExts.includes(ext)) return cb(new Error('Invalid file type'));
    cb(null, true);
  }
});

router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, filename: req.file.originalname, url: fileUrl });
});

export default router;
