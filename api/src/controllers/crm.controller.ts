import { Request, Response } from 'express';
import { CrmService } from '../services/crm.service.js';
import { CreateLeadSchema } from '../shared_local/index.js';

const crmService = new CrmService();

export class CrmController {
  
  async getLeads(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const leads = await crmService.getLeads(businessId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  }

  async createLead(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const data = CreateLeadSchema.parse(req.body);
      const lead = await crmService.createLead(businessId, data);
      res.json(lead);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create lead' });
    }
  }
}
