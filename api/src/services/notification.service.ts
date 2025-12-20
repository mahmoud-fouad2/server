import prisma from '../config/database.js';

export class NotificationService {
  
  async getNotifications(businessId: string) {
    return prisma.notification.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async createNotification(businessId: string, message: string, type: string) {
    return prisma.notification.create({
      data: {
        businessId,
        message,
        type,
        isRead: false
      }
    });
  }
}
