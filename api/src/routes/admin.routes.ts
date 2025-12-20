import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();
const adminController = new AdminController();

// Protect all admin routes with SUPERADMIN role
router.use(authenticateToken);
router.use(authorizeRole(['SUPERADMIN']));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/businesses', adminController.getBusinesses);
router.post('/businesses/:id/verify', adminController.verifyBusiness);
router.post('/businesses/:id/quota', adminController.updateQuota);

export default router;
