import { Router } from 'express';
import { systemController } from '../controllers/system.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { authenticateSystemKey } from '../middleware/systemKey.js';
import { Role } from '@prisma/client';

const router = Router();

router.post(
  '/flush-cache',
  authenticateToken,
  authorizeRole([Role.ADMIN, Role.SUPERADMIN]),
  systemController.flushCache
);

router.post(
  '/flush-cache/service',
  authenticateSystemKey,
  systemController.flushCache
);

export default router;
