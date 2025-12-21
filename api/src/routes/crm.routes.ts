import { Router } from 'express';
import { CrmController } from '../controllers/crm.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const crmController = new CrmController();

router.use(authenticateToken);

router.get('/leads', crmController.getLeads.bind(crmController));
router.post('/leads', crmController.createLead.bind(crmController));

// Dashboard helpers
router.get('/status', crmController.getStatus.bind(crmController));
router.post('/toggle', crmController.toggleCrm.bind(crmController));
router.get('/export', crmController.exportLeads.bind(crmController));

export default router;
