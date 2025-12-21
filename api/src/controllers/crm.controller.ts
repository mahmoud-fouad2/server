import { Request, Response } from 'express';
import { CrmService } from '../services/crm.service.js';
import { CreateLeadSchema } from '../shared_local/index.js';
import prisma from '../config/database.js';

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

  async getStatus(req: Request, res: Response) {
    try {
      const businessId = (req.headers['x-business-id'] as string) || (req as any).user?.businessId;
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      const business = await prisma.business.findUnique({
        where: { id: String(businessId) },
        select: { crmLeadCollectionEnabled: true },
      });

      res.json({
        enabled: !!business?.crmLeadCollectionEnabled,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch CRM status' });
    }
  }

  async toggleCrm(req: Request, res: Response) {
    try {
      const businessId = (req.headers['x-business-id'] as string) || (req as any).user?.businessId;
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      const enabled = !!req.body?.enabled;
      const updated = await prisma.business.update({
        where: { id: String(businessId) },
        data: { crmLeadCollectionEnabled: enabled },
        select: { id: true, crmLeadCollectionEnabled: true },
      });

      res.json({
        success: true,
        enabled: updated.crmLeadCollectionEnabled,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle CRM' });
    }
  }

  async exportLeads(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const leads = await crmService.getLeads(businessId);
      res.json({ success: true, leads });
    } catch (error) {
      res.status(500).json({ error: 'Failed to export leads' });
    }
  }
}
