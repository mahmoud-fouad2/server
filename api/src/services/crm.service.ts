import prisma from '../config/database.js';
import { CreateLeadInput } from '../shared_local/index.js';

export class CrmService {
  
  async getLeads(businessId: string) {
    return prisma.crmLead.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createLead(businessId: string, data: CreateLeadInput) {
    // Separate notes from the main lead data as it is a relation
    const { notes, ...leadData } = data;
    
    return prisma.crmLead.create({
      data: {
        businessId,
        ...leadData,
        status: 'NEW'
      }
    });
  }

  async updateLeadStatus(leadId: string, status: string) {
    return prisma.crmLead.update({
      where: { id: leadId },
      data: { status }
    });
  }
}
