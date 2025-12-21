import { Request, Response } from 'express';
import { VisitorService } from '../services/visitor.service.js';
import prisma from '../config/database.js';

const visitorService = new VisitorService();

export class VisitorController {
  async createSession(req: Request, res: Response) {
    try {
      const businessId = req.body.businessId || req.query.businessId || req.headers['x-business-id'];
      const fingerprint = req.body.fingerprint || req.headers['x-fingerprint'] || `fp_${Date.now()}_${Math.random().toString(36).substring(2)}`;

      if (!businessId) {
        return res.status(400).json({ error: 'Business ID required' });
      }
      
      // التحقق من وجود الـ business
      const business = await prisma.business.findUnique({
        where: { id: businessId as string }
      });
      
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      const session = await visitorService.getOrCreateSession(businessId as string, fingerprint as string, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        country: req.body.country,
        city: req.body.city,
        device: req.body.device,
      });

      res.json({ id: session.id, sessionId: session.id, success: true, data: session });
    } catch (error) {
      console.error('Visitor Session Error:', error);
      res.status(500).json({ 
        error: 'Failed to create session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async trackPage(req: Request, res: Response) {
    try {
      const { sessionId, url, title } = req.body;
      if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

      await visitorService.trackPageView(sessionId, { url, title });
      res.json({ success: true });
    } catch (error) {
      console.error('Track Page Error:', error);
      res.status(500).json({ error: 'Failed to track page view' });
    }
  }

  async getActiveSessions(req: Request, res: Response) {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch active sessions' });
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      res.json({ visitors: 0, sessions: 0, pageViews: 0 });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch visitor analytics' });
    }
  }
}
