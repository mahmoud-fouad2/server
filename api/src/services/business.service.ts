import prisma from '../config/database.js';

export class BusinessService {
  
  async getBusinessDetails(businessId: string) {
    return prisma.business.findUnique({
      where: { id: businessId },
      include: {
        _count: {
          select: { conversations: true, crmLeads: true }
        }
      }
    });
  }

  async updateBusiness(businessId: string, data: any) {
    return prisma.business.update({
      where: { id: businessId },
      data
    });
  }
}
