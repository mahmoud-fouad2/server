import { Request, Response } from 'express';
import { IntegrationService } from '../services/integration.service.js';
import { AuthRequest } from '../middleware/auth.js';

const integrationService = new IntegrationService();

export class IntegrationController {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      const integrations = await integrationService.getIntegrations(businessId);
      res.json(integrations);
    } catch (error) {
      console.error('Get Integrations Error:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  }

  async updateTelegram(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const { botToken } = req.body;
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      const result = await integrationService.updateTelegram(businessId, { botToken });
      res.json(result);
    } catch (error) {
      console.error('Update Telegram Error:', error);
      res.status(500).json({ error: 'Failed to update Telegram integration' });
    }
  }

  async updateWhatsApp(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const { phoneNumberId, accessToken, verifyToken } = req.body;
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      const result = await integrationService.updateWhatsApp(businessId, { phoneNumberId, accessToken, verifyToken });
      res.json(result);
    } catch (error) {
      console.error('Update WhatsApp Error:', error);
      res.status(500).json({ error: 'Failed to update WhatsApp integration' });
    }
  }

  async remove(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const { type } = req.params;
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      if (type !== 'telegram' && type !== 'whatsapp') {
        return res.status(400).json({ error: 'Invalid integration type' });
      }

      await integrationService.removeIntegration(businessId, type);
      res.json({ message: 'Integration removed' });
    } catch (error) {
      console.error('Remove Integration Error:', error);
      res.status(500).json({ error: 'Failed to remove integration' });
    }
  }
}
