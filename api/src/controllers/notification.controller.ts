import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.js';

const notificationService = new NotificationService();

export class NotificationController {
  
  async list(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const notifications = await notificationService.getNotifications(businessId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  async markRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await notificationService.markAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to update notification' });
    }
  }

  async unreadCount(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      const count = await notificationService.getUnreadCount(businessId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch unread count' });
    }
  }

  async markAllRead(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user.businessId;
      await notificationService.markAllRead(businessId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark all read' });
    }
  }
}
