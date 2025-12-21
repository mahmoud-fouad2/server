import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';
import { AuthRequest } from '../middleware/auth.js';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      const { start, end } = req.query;
      const daysParam = (req.params as any)?.days;
      const days = daysParam ? Math.max(1, Math.min(365, Number(daysParam))) : 30;
      const startDate = start ? new Date(start as string) : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end as string) : new Date();

      const stats = await analyticsService.getDashboardStats(businessId, startDate, endDate);
      res.json(stats);
    } catch (error) {
      console.error('Analytics Dashboard Error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  async getRealtime(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      const data = await analyticsService.getRealtimeStats(businessId);
      res.json(data);
    } catch (error) {
      console.error('Analytics Realtime Error:', error);
      res.status(500).json({ error: 'Failed to fetch realtime analytics' });
    }
  }

  async getVectorStats(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      const data = await analyticsService.getVectorStats(businessId);
      res.json(data);
    } catch (error) {
      console.error('Analytics VectorStats Error:', error);
      res.status(500).json({ error: 'Failed to fetch vector stats' });
    }
  }

  async getAlerts(req: AuthRequest, res: Response) {
    try {
      // Placeholder for alerts to prevent 404
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  }

  async getRatingStats(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      const stats = await analyticsService.getRatingStats(businessId);
      res.json(stats);
    } catch (error) {
      console.error('Rating Stats Error:', error);
      res.status(500).json({ error: 'Failed to fetch rating stats' });
    }
  }
}
}
