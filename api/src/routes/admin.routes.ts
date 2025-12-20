import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = Router();
const adminController = new AdminController();

// Protect all admin routes with SUPERADMIN role
router.use(authenticateToken);
router.use(authorizeRole(['SUPERADMIN']));

// Dashboard & Stats
router.get('/stats', adminController.getStats);
router.get('/stats/financial', adminController.getFinancialStats);
router.get('/system/health', adminController.getSystemHealth);

// User Management
router.get('/users', adminController.getUsers);

// Business Management
router.get('/businesses', adminController.getBusinesses);
router.post('/businesses/:id/verify', adminController.verifyBusiness);
router.post('/businesses/:id/suspend', adminController.suspendBusiness);
router.post('/businesses/:id/activate', adminController.activateBusiness);
router.delete('/businesses/:id', adminController.deleteBusiness);
router.post('/businesses/:id/quota', adminController.updateQuota);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
