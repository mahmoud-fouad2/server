import { Request, Response } from 'express';
import { AIService } from '../services/ai.service.js';

const aiService = new AIService();

export class AIController {
  
  async listModels(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const models = await aiService.getModels(businessId);
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch AI models' });
    }
  }

  async createModel(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const { name, config } = req.body;
      const model = await aiService.createModel(businessId, name, config);
      res.json(model);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create AI model' });
    }
  }
}
