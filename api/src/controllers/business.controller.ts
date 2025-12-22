import { Request, Response } from 'express';
import { BusinessService } from '../services/business.service.js';
import { IntegrationService } from '../services/integration.service.js';
import { cacheService } from '../services/cache.service.js';

const businessService = new BusinessService();
const integrationService = new IntegrationService();

function getBusinessId(req: Request): string | null {
  const headerId = req.headers['x-business-id'];
  if (typeof headerId === 'string' && headerId.trim()) return headerId.trim();
  // @ts-ignore
  return (req.user && req.user.businessId) ? String(req.user.businessId) : null;
}

export class BusinessController {
  
  async getDetails(req: Request, res: Response) {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });
      const business = await businessService.getBusinessDetails(businessId);
      res.json(business);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch business details' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });
      const updated = await businessService.updateBusiness(businessId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update business' });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });
      const stats = await businessService.getStats(businessId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch business stats' });
    }
  }

  async getSettings(req: Request, res: Response) {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });
      const settings = await businessService.getSettings(businessId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });
      const updated = await businessService.updateSettings(businessId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  async updatePlan(req: Request, res: Response) {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });
      const updated = await businessService.updatePlan(businessId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update plan' });
    }
  }

  async getIntegrations(req: Request, res: Response) {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });
      const data = await integrationService.getIntegrations(businessId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  }

  async getChartData(req: Request, res: Response) {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });
      const data = await businessService.getChartData(businessId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chart data' });
    }
  }

  async getConversations(req: Request, res: Response) {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });
      const data = await businessService.getConversations(businessId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }

  async updatePreChatSettings(req: Request, res: Response) {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });
      const { preChatFormEnabled } = req.body || {};
      const updated = await businessService.updatePreChatSettings(businessId, { preChatFormEnabled });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update pre-chat settings' });
    }
  }

  async invalidateCache(req: Request, res: Response) {
    try {
      const businessId = getBusinessId(req);
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      // Best-effort cache invalidation; do not fail the request if cache is unavailable.
      await cacheService.del(`business:${businessId}:*`).catch(() => {});
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to invalidate cache' });
    }
  }
}
