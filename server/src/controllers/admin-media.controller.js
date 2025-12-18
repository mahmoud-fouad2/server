import fs from 'fs';
import path from 'path';
import prisma from '../config/database.js';
import storage from '../services/storage.service.js';
import logger from '../utils/logger.js';

/**
 * List media files for admin panel.
 * Combines widget icons and knowledge original files for now.
 */
export const getMediaList = async (req, res) => {
  try {
    const files = [];

    // 1) Widget icons stored under public/uploads/icons
    const iconsDir = path.join(process.cwd(), 'public', 'uploads', 'icons');
    if (fs.existsSync(iconsDir)) {
      const iconFiles = fs.readdirSync(iconsDir || []).map(f => ({
        source: 'widget_icon',
        filename: f,
        url: `/uploads/icons/${f}`
      }));
      files.push(...iconFiles);
    }

    // 2) Knowledge original files referenced in DB metadata (best-effort: continue if DB unavailable)
    try {
      const kbs = await prisma.knowledgeBase.findMany({ where: { metadata: { not: null } } });
      for (const kb of kbs) {
        const original = (kb.metadata && kb.metadata.originalFileUrl) || null;
        if (original) files.push({ source: 'knowledge', filename: path.basename(original), url: original, kbId: kb.id, businessId: kb.businessId });
      }
    } catch (e) {
      logger.warn('getMediaList: DB unavailable, skipping knowledge media scan', { error: e?.message || e });
    }

    res.json({ success: true, files });
  } catch (err) {
    logger.error('getMediaList failed', err);
    res.status(500).json({ success: false, error: 'Failed to list media' });
  }
};

/**
 * Delete a media file (safe: only allow deleting local uploads under /public/uploads or S3 objects managed by app)
 */
export const deleteMedia = async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ success: false, error: 'url is required' });

  try {
    // Only allow deleting local uploads or S3-managed keys that include 'uploads/'
    if (!url.includes('/uploads/')) {
      return res.status(400).json({ success: false, error: 'Only deletions for uploads managed by the app are allowed' });
    }

    // S3 mode: if storage is configured, attempt delete via S3 API
    if (storage.isS3Enabled && url.startsWith('http')) {
      // Try to derive key from URL (best-effort)
      let key = url.split(process.env.S3_PUBLIC_URL || process.env.AWS_S3_BUCKET || '').pop();
      key = key.startsWith('/') ? key.slice(1) : key;
      try {
        const s3mod = await import('@aws-sdk/client-s3');
        const DeleteObjectCommand = s3mod.DeleteObjectCommand;
        const S3Client = s3mod.S3Client;
        const client = S3Client ? new S3Client({ region: process.env.AWS_REGION }) : null;
        if (client && DeleteObjectCommand) {
          await client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key }));
        }
      } catch (e) {
        logger.warn('admin-media.deleteMedia: AWS SDK not available or delete failed', { error: e?.message || e });
      }
      return res.json({ success: true, message: 'Deleted (S3) if present' });
    }

    // Local file: map URL to public path and unlink
    const idx = url.indexOf('/uploads/');
    const rel = url.slice(idx + 1); // remove leading /
    const localPath = path.join(process.cwd(), 'public', ...rel.split('/').slice(1));
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
      return res.json({ success: true, message: 'Deleted' });
    }

    return res.status(404).json({ success: false, error: 'File not found' });
  } catch (err) {
    logger.error('deleteMedia failed', err);
    res.status(500).json({ success: false, error: 'Failed to delete media' });
  }
};

export default {
  getMediaList,
  deleteMedia
};
// Named exports omitted; use default export for controller compatibility
