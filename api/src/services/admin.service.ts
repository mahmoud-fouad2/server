import prisma from '../config/database';

export class AdminService {
  async getStats() {
    const [users, businesses, tickets, messages] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.ticket.count(),
      prisma.conversation.count(), // Assuming Conversation is the message container
    ]);

    return {
      users,
      businesses,
      tickets,
      messages,
    };
  }

  async getUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { businesses: true },
      }),
      prisma.user.count(),
    ]);

    return { users, total, page, limit };
  }

  async getBusinesses(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true } } },
      }),
      prisma.business.count(),
    ]);

    return { businesses, total, page, limit };
  }

  async verifyBusiness(businessId: string) {
    return prisma.business.update({
      where: { id: businessId },
      data: { status: 'ACTIVE' }, // Assuming ACTIVE is the verified status
    });
  }

  async updateQuota(businessId: string, quota: number) {
    return prisma.business.update({
      where: { id: businessId },
      data: { messageQuota: quota },
    });
  }
}
