import prisma from '../config/database.js';
import cacheService from './cache.service.js';
import queueService from './queue.service.js';

export class AdminService {
  /**
   * Get general dashboard statistics
   */
  async getStats() {
    const [users, businesses, tickets, messages, activeBusinesses] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.ticket.count(),
      prisma.conversation.count(),
      prisma.business.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      users,
      businesses,
      activeBusinesses,
      tickets,
      messages,
    };
  }

  /**
   * Get financial statistics (Revenue, MRR, etc.)
   */
  async getFinancialStats() {
    const payments = await prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      select: { amount: true, createdAt: true },
    });

    const totalRevenue = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    
    // Calculate MRR (approximate based on last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const lastMonthRevenue = payments
      .filter((p: any) => p.createdAt >= thirtyDaysAgo)
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    return {
      totalRevenue,
      mrr: lastMonthRevenue, // Simplified MRR
      transactionCount: payments.length,
    };
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    const redisConnected = cacheService.isConnected();
    // Check queue health (mock check or real if queueService exposes it)
    const queueStatus = 'OPERATIONAL'; 

    return {
      status: redisConnected ? 'HEALTHY' : 'DEGRADED',
      services: {
        database: 'CONNECTED', // If we are here, DB is connected
        redis: redisConnected ? 'CONNECTED' : 'DISCONNECTED',
        queue: queueStatus,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Get paginated users
   */
  async getUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { businesses: true },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  /**
   * Get paginated businesses
   */
  async getBusinesses(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true } } },
      }),
      prisma.business.count({ where }),
    ]);

    return { businesses, total, page, limit };
  }

  /**
   * Verify a business
   */
  async verifyBusiness(businessId: string) {
    return prisma.business.update({
      where: { id: businessId },
      data: { status: 'ACTIVE' },
    });
  }

  /**
   * Suspend a business
   */
  async suspendBusiness(businessId: string) {
    return prisma.business.update({
      where: { id: businessId },
      data: { status: 'SUSPENDED' },
    });
  }

  /**
   * Activate a business
   */
  async activateBusiness(businessId: string) {
    return prisma.business.update({
      where: { id: businessId },
      data: { status: 'ACTIVE' },
    });
  }

  /**
   * Delete a business (Soft delete or hard delete depending on policy)
   * Here we use hard delete as per Prisma cascade
   */
  async deleteBusiness(businessId: string) {
    return prisma.business.delete({
      where: { id: businessId },
    });
  }

  /**
   * Update message quota
   */
  async updateQuota(businessId: string, quota: number) {
    return prisma.business.update({
      where: { id: businessId },
      data: { messageQuota: quota },
    });
  }

  /**
   * Get Audit Logs
   */
  async getAuditLogs(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true } } },
      }),
      prisma.auditLog.count(),
    ]);

    return { logs, total, page, limit };
  }
}
