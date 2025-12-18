import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export const getUnreadCount = async (req, res) => {
  try {
    const businessId = req.user && req.user.businessId;
    if (!businessId) return res.status(400).json({ error: 'Business ID required' });

    // Count distinct tickets that have at least one unread ticket message
    const ticketsUnread = await prisma.ticket.count({
      where: {
        businessId,
        messages: {
          some: {
            isReadByBusiness: false,
            NOT: { senderId: req.user.userId }
          }
        }
      }
    });

    const messagesUnread = await prisma.message.count({
      where: {
        conversation: { businessId },
        role: 'USER',
        isReadByBusiness: false
      }
    });

    const notificationsUnread = await prisma.notification.count({ where: { businessId, isRead: false } });

    res.json({ ticketsUnread, messagesUnread, notificationsUnread });
  } catch (err) {
    logger.error('getUnreadCount error', err);
    res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
};

export const listNotifications = async (req, res) => {
  try {
    const businessId = req.user && req.user.businessId;
    if (!businessId) return res.status(400).json({ error: 'Business ID required' });

    const notifications = await prisma.notification.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json(notifications);
  } catch (err) {
    logger.error('listNotifications error', err);
    res.status(500).json({ error: 'Failed to list notifications' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const businessId = req.user && req.user.businessId;
    const id = req.params.id;
    if (!businessId) return res.status(400).json({ error: 'Business ID required' });
    if (!id) return res.status(400).json({ error: 'Notification ID required' });

    await prisma.notification.updateMany({ where: { id, businessId }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    logger.error('markAsRead error', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const businessId = req.user && req.user.businessId;
    if (!businessId) return res.status(400).json({ error: 'Business ID required' });

    await prisma.notification.updateMany({ where: { businessId, isRead: false }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    logger.error('markAllRead error', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};
