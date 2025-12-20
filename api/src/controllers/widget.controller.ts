import { Request, Response } from 'express';
import { WidgetService } from '../services/widget.service.js';
import path from 'path';
import fs from 'fs';

const widgetService = new WidgetService();

export class WidgetController {
  
  async getConfig(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      
      // Cache headers for performance
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      
      const config = await widgetService.getPublicConfig(businessId);
      res.json(config);
    } catch (error) {
      console.error('Error fetching widget config:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getLoader(req: Request, res: Response) {
    // Resolve path to the built widget file in the sibling 'widget' workspace
    // Assuming process.cwd() is the 'api' directory
    const widgetPath = path.resolve(process.cwd(), '../widget/dist/fahimo-loader.iife.js');
    
    if (fs.existsSync(widgetPath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.sendFile(widgetPath);
    } else {
      console.error('Widget loader not found at:', widgetPath);
      res.status(404).send('Widget loader not found. Please run "npm run build" in the widget directory.');
    }
  }

  async subscribe(req: Request, res: Response) {
    try {
      const { businessId } = req.query;
      
      if (!businessId || typeof businessId !== 'string') {
        return res.status(400).json({ error: 'businessId is required' });
      }

      // Get widget config for the business
      const config = await widgetService.getPublicConfig(businessId);
      
      // Return subscription info (for SSE or polling setup)
      res.json({
        success: true,
        businessId,
        config,
        endpoints: {
          chat: `/api/chat`,
          socket: process.env.SOCKET_URL || '/',
        }
      });
    } catch (error) {
      console.error('Error in widget subscribe:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
