import { Router } from 'express';
import { CrmController } from '../controllers/crm.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const crmController = new CrmController();

router.use(authenticateToken);

router.get('/leads', crmController.getLeads.bind(crmController));
router.post('/leads', crmController.createLead.bind(crmController));

export default router;
