import { Request, Response } from 'express';
import { KnowledgeService } from '../services/knowledge.service.js';
import { CreateKnowledgeSchema } from '../shared_local/index.js';

const knowledgeService = new KnowledgeService();

export class KnowledgeController {
  
  async getEntries(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user?.businessId;
      if (!businessId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const entries = await knowledgeService.getEntries(businessId);
      res.json({ success: true, data: entries, count: entries.length });
    } catch (error) {
      console.error('Knowledge fetch error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch knowledge base',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createEntry(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user?.businessId;
      if (!businessId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const data = CreateKnowledgeSchema.parse(req.body);
      const entry = await knowledgeService.createEntry(businessId, data);
      res.status(201).json({ success: true, data: entry });
    } catch (error) {
      console.error('Knowledge create error:', error);
      res.status(400).json({ 
        error: 'Failed to create entry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
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

  async reindex(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const result = await knowledgeService.reindex(businessId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to trigger re-indexing' });
    }
  }
}
