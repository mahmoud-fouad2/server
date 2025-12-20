import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { AuthRequest } from '../middleware/auth';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      if (!businessId) return res.status(400).json({ error: 'Business ID required' });

      const { start, end } = req.query;
      const startDate = start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end as string) : new Date();

      const stats = await analyticsService.getDashboardStats(businessId, startDate, endDate);
      res.json(stats);
    } catch (error) {
      console.error('Analytics Dashboard Error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
}
