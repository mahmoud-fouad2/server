const prisma = require('../config/database');
const logger = require('../utils/logger');

exports.getUnreadCount = async (req, res) => {
  try {
    const businessId = req.user && req.user.businessId;
    if (!businessId) return res.status(400).json({ error: 'Business ID required' });

    const ticketsUnread = await prisma.ticketMessage.count({
      where: {
        ticket: { businessId },
        AND: [
          { isReadByBusiness: false },
          { NOT: { senderId: req.user.userId } }
        ]
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

exports.listNotifications = async (req, res) => {
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

exports.markAsRead = async (req, res) => {
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

exports.markAllRead = async (req, res) => {
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
