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

  // POST /api/knowledge/text - Import raw text (wizard)
  async createFromText(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user?.businessId;
      if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

      const { text, title } = req.body;
      if (!text || typeof text !== 'string' || text.trim().length < 10) {
        return res.status(400).json({ error: 'Text is required and must be at least 10 characters' });
      }

      const result = await knowledgeService.importFromText(businessId, text, { chunkSize: 1000, overlap: 200 });
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Knowledge import text error:', error);
      res.status(500).json({ error: 'Failed to import text' });
    }
  }

  // POST /api/knowledge/url - Crawl and import from URL
  async createFromUrl(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user?.businessId;
      if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

      const { url } = req.body;
      if (!url || typeof url !== 'string') return res.status(400).json({ error: 'URL is required' });

      const result = await knowledgeService.importFromUrl(businessId, url);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Knowledge import url error:', error);
      res.status(500).json({ error: 'Failed to import from URL' });
    }
  }

  // POST /api/knowledge/upload - Upload file and import (PDF/TXT)
  async uploadFile(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user?.businessId;
      if (!businessId) return res.status(401).json({ error: 'Unauthorized' });

      const file = (req as any).file;
      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      // Basic handling: support text files and PDFs
      const fs = await import('fs');
      const path = file.path;
      const mime = file.mimetype;

      let text = '';
      if (mime === 'application/pdf') {
        const pdfParse = await import('pdf-parse');
        const buffer = fs.readFileSync(path);
        const parsed = await pdfParse.default(buffer);
        text = parsed.text;
      } else if (mime.startsWith('text') || mime === 'application/octet-stream') {
        text = fs.readFileSync(path, 'utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      if (!text || text.trim().length === 0) return res.status(400).json({ error: 'Uploaded file is empty' });

      const result = await knowledgeService.importFromText(businessId, text, { chunkSize: 1000, overlap: 200 });
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Knowledge upload error:', error);
      res.status(500).json({ error: 'Failed to process uploaded file' });
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

  async updateEntry(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const { id } = req.params;
      const data = req.body;
      const updated = await knowledgeService.updateEntry(businessId, id, data);
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Knowledge update error:', error);
      res.status(400).json({ 
        error: 'Failed to update entry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
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
