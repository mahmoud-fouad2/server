import { Request, Response } from 'express';
import { BusinessService } from '../services/business.service.js';

const businessService = new BusinessService();

export class BusinessController {
  
  async getDetails(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const business = await businessService.getBusinessDetails(businessId);
      res.json(business);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch business details' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const updated = await businessService.updateBusiness(businessId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update business' });
    }
  }
}
