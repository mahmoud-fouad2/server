import { Request, Response } from 'express';
import { WidgetService } from '../services/widget.service.js';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database.js';
import { WidgetConfigSchema } from '../shared_local/index.js';

const widgetService = new WidgetService();

export class WidgetController {
  
  async getConfig(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      
      // Disable caching so the public widget always reflects the latest config immediately
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      const config = await widgetService.getPublicConfig(businessId);
      res.json(config);
    } catch (error) {
      console.error('Error fetching widget config:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async updateConfig(req: Request, res: Response) {
    try {
      const businessId = (req as any).user?.businessId;
      if (!businessId) {
        return res.status(400).json({ error: 'Business ID required' });
      }

      // Allow partial updates; merge with existing stored config.
      const incoming = (req.body && typeof req.body === 'object') ? req.body : {};
      const partial = WidgetConfigSchema.partial().parse(incoming);

      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { widgetConfig: true },
      });

      let current: any = {};
      try {
        current = business?.widgetConfig ? JSON.parse(business.widgetConfig) : {};
      } catch (e) {
        current = {};
      }

      const merged = WidgetConfigSchema.parse({
        ...current,
        ...partial,
      });

      const updated = await prisma.business.update({
        where: { id: businessId },
        data: {
          widgetConfig: JSON.stringify(merged),
          // Keep Business.primaryColor in sync when provided
          ...(merged.primaryColor ? { primaryColor: merged.primaryColor } : {}),
        },
        select: {
          id: true,
          widgetVariant: true,
          widgetConfig: true,
          preChatFormEnabled: true,
        },
      });

      res.json({
        success: true,
        businessId: updated.id,
        widgetVariant: updated.widgetVariant,
        widgetConfig: merged,
        preChatFormEnabled: updated.preChatFormEnabled,
        configVersion: Date.now(),
      });
    } catch (error) {
      console.error('Error updating widget config:', error);
      res.status(500).json({ error: 'Failed to update widget config' });
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
