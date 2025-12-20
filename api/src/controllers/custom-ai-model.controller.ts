import { Request, Response } from 'express';
import { CustomAIModelService } from '../services/custom-ai-model.service.js';
import { AuthRequest } from '../middleware/auth.js';

const service = new CustomAIModelService();

export class CustomAIModelController {
  async create(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const { name, description, config } = req.body;

      const model = await service.createModel(businessId, { name, description, config });
      res.status(201).json(model);
    } catch (error) {
      console.error('Create Model Error:', error);
      res.status(500).json({ error: 'Failed to create model' });
    }
  }

  async list(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const models = await service.getModels(businessId);
      res.json(models);
    } catch (error) {
      console.error('List Models Error:', error);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const businessId = req.user!.businessId;
      const { id } = req.params;
      await service.deleteModel(id, businessId);
      res.json({ message: 'Model deleted' });
    } catch (error) {
      console.error('Delete Model Error:', error);
      res.status(500).json({ error: 'Failed to delete model' });
    }
  }
}
