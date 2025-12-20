import { Request, Response } from 'express';
import { KnowledgeService } from '../services/knowledge.service.js';
import { CreateKnowledgeSchema } from '../shared_local/index.js';

const knowledgeService = new KnowledgeService();

export class KnowledgeController {
  
  async getEntries(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const entries = await knowledgeService.getEntries(businessId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch knowledge base' });
    }
  }

  async createEntry(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const data = CreateKnowledgeSchema.parse(req.body);
      const entry = await knowledgeService.createEntry(businessId, data);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create entry' });
    }
  }

  async deleteEntry(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const { id } = req.params;
      await knowledgeService.deleteEntry(businessId, id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete entry' });
    }
  }
}
