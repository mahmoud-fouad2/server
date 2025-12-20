import { Request, Response } from 'express';
import { ContinuousImprovementService } from '../services/continuous-improvement.service.js';
import { AuthRequest } from '../middleware/auth.js';

const service = new ContinuousImprovementService();

export class ContinuousImprovementController {
  async getGaps(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;

      const result = await service.analyzeKnowledgeGaps(businessId, { limit, offset });
      res.json(result);
    } catch (error) {
      console.error('Get Gaps Error:', error);
      res.status(500).json({ error: 'Failed to fetch knowledge gaps' });
    }
  }

  async getSuggestions(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const suggestions = await service.getSuggestions(businessId);
      res.json(suggestions);
    } catch (error) {
      console.error('Get Suggestions Error:', error);
      res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
  }
}
