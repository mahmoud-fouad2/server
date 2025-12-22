import { Request, Response } from 'express';
import { VisitorService } from '../services/visitor.service.js';
import prisma from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

const visitorService = new VisitorService();

export class VisitorController {
  private resolveBusinessId(req: AuthRequest) {
    return (
      req.user?.businessId ||
      (req.headers['x-business-id'] as string) ||
      (req.query?.businessId as string) ||
      (req.params as Record<string, string | undefined>)?.businessId
    );
  }

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
        browser: req.body.browser,
        os: req.body.os,
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
      const { sessionId, url, title, referrer, origin } = req.body;
      if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

      await visitorService.trackPageView(sessionId, { url, title, referrer, origin });
      res.json({ success: true });
    } catch (error) {
      console.error('Track Page Error:', error);
      res.status(500).json({ error: 'Failed to track page view' });
    }
  }

  async getActiveSessions(req: AuthRequest, res: Response) {
    try {
      const businessId = this.resolveBusinessId(req);
      if (!businessId) {
        return res.status(400).json({ success: false, error: 'Business ID required' });
      }

      const sessions = await visitorService.getActiveSessions(businessId as string);
      res.json({ success: true, sessions });
    } catch (error) {
      console.error('Visitor Active Sessions Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch active sessions' });
    }
  }

  async getAnalytics(req: AuthRequest, res: Response) {
    try {
      const businessId = this.resolveBusinessId(req);
      if (!businessId) {
        return res.status(400).json({ success: false, error: 'Business ID required' });
      }

      const rawFrom = req.query?.from ? new Date(String(req.query.from)) : undefined;
      const rawTo = req.query?.to ? new Date(String(req.query.to)) : undefined;
      const fromParam = rawFrom && !isNaN(rawFrom.getTime()) ? rawFrom : undefined;
      const toParam = rawTo && !isNaN(rawTo.getTime()) ? rawTo : undefined;

      const analytics = await visitorService.getAnalytics(businessId as string, { from: fromParam, to: toParam });
      res.json({ success: true, analytics });
    } catch (error) {
      console.error('Visitor Analytics Error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch visitor analytics' });
    }
  }
}
