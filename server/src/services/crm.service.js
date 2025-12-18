/**
 * CRM Service
 * Handles Customer Relationship Management operations
 */

import prisma from '../config/database.js';

class CrmService {
  /**
   * Create a new CRM lead
   */
  async createLead(businessId, leadData) {
    const { name, email, phone, requestSummary, conversationId, source = 'PRE_CHAT_FORM' } = leadData;

    return await prisma.crmLead.create({
      data: {
        businessId,
        name,
        email,
        phone,
        requestSummary,
        conversationId,
        source
      }
    });
  }

  /**
   * Get all leads for a business
   */
  async getLeads(businessId, filters = {}) {
    const { page = 1, limit = 20, search, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where = {
      businessId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { requestSummary: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [leads, total] = await Promise.all([
      prisma.crmLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.crmLead.count({ where })
    ]);

    return {
      data: leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Export leads to CSV format
   */
  async exportLeads(businessId, filters = {}) {
    const { data: leads } = await this.getLeads(businessId, { ...filters, limit: 10000 });

    const csvHeaders = ['Name', 'Email', 'Phone', 'Request Summary', 'Source', 'Created At'];
    const csvData = leads.map(lead => [
      lead.name,
      lead.email || '',
      lead.phone || '',
      lead.requestSummary,
      lead.source,
      lead.createdAt.toISOString()
    ]);

    return { headers: csvHeaders, data: csvData };
  }

  /**
   * Generate dynamic request summary based on business type
   */
  generateRequestSummary(businessType) {
    const summaries = {
      // Food & Beverage
      'RESTAURANT': 'طلب أكل أو حجز طاولة',
      'CAFE': 'طلب مشروبات أو وجبات خفيفة',
      'BAKERY': 'طلب حلويات أو منتجات مخبوزة',

      // Healthcare
      'CLINIC': 'استشارة طبية أو موعد مع الطبيب',
      'HOSPITAL': 'خدمات طبية طارئة أو مواعيد',
      'PHARMACY': 'استشارة دوائية أو طلب أدوية',
      'DENTAL': 'خدمات أسنان أو موعد مع طبيب الأسنان',

      // Retail & Shopping
      'RETAIL': 'استفسار عن منتجات أو خدمات',
      'FASHION': 'استفسار عن ملابس أو إكسسوارات',
      'ELECTRONICS': 'استفسار عن أجهزة إلكترونية',
      'JEWELRY': 'استفسار عن مجوهرات أو ساعات',
      'FURNITURE': 'استفسار عن أثاث منزلي',

      // Business & Services
      'COMPANY': 'استفسار عن خدمات الشركة',
      'CONSULTING': 'طلب استشارة متخصصة',
      'LEGAL': 'استشارة قانونية',
      'ACCOUNTING': 'خدمات محاسبية',
      'REALESTATE': 'شراء أو إيجار عقار',
      'IT': 'خدمات تقنية معلومات',
      'SOFTWARE': 'حلول برمجية',
      'DIGITAL': 'خدمات تسويق رقمي',
      'MARKETING': 'خدمات تسويق وإعلان',
      'DESIGN': 'خدمات تصميم',
      'PHOTOGRAPHY': 'خدمات تصوير',
      'EVENTS': 'تنظيم فعاليات',
      'ECOMMERCE': 'طلب منتجات عبر الإنترنت',
      'DROPSHIPPING': 'طلب منتجات',
      'MAINTENANCE': 'خدمات صيانة',
      'SECURITY': 'خدمات أمنية',
      'TELECOM': 'خدمات اتصالات',
      'ARCHITECTURE': 'خدمات معمارية',
      'INTERIOR': 'تصميم داخلي',
      'CONSTRUCTION': 'خدمات إنشاءات',

      // Education
      'EDUCATION': 'التسجيل في دورة تدريبية',
      'SCHOOL': 'استفسار عن التعليم',
      'UNIVERSITY': 'استفسار عن الدراسة الجامعية',

      // Finance
      'BANK': 'خدمات مصرفية',
      'INSURANCE': 'استفسار عن تأمين',
      'INVESTMENT': 'استشارة استثمارية',

      // Hospitality & Tourism
      'HOTEL': 'حجز غرفة أو خدمات فندقية',
      'TRAVEL': 'حجز رحلة أو خدمات سفر',
      'TOURISM': 'استفسار عن خدمات سياحية',

      // Beauty & Wellness
      'SALON': 'حجز موعد في صالون التجميل',
      'SPA': 'حجز جلسة سبا',
      'GYM': 'الاشتراك في النادي الرياضي',

      // Automotive & Transport
      'AUTOMOTIVE': 'استفسار عن سيارات',
      'CARMAINTENANCE': 'خدمات صيانة سيارات',
      'LOGISTICS': 'خدمات نقل ولوجستيات',

      // Other
      'OTHER': 'استفسار عام'
    };

    return summaries[businessType] || 'استفسار عن الخدمات';
  }

  /**
   * Check if CRM is enabled for a business
   */
  async isCrmEnabled(businessId) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { crmLeadCollectionEnabled: true }
    });

    return business?.crmLeadCollectionEnabled || false;
  }

  /**
   * Enable/disable CRM for a business (Super Admin only)
   */
  async toggleCrm(businessId, enabled) {
    try {
      return await prisma.business.update({
        where: { id: businessId },
        data: { crmLeadCollectionEnabled: enabled }
      });
    } catch (e) {
      if (e && e.code === 'P2025') {
        logger.warn('toggleCrm: business not found', { businessId });
        return null;
      }
      throw e;
    }
  }

  /**
   * Get CRM statistics for a business
   */
  async getCrmStats(businessId, filters = {}) {
    const { startDate, endDate } = filters;
    
    const where = {
      businessId,
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [
      totalLeads,
      leadsBySource,
      recentLeads,
      leadsByDay
    ] = await Promise.all([
      prisma.crmLead.count({ where }),
      prisma.crmLead.groupBy({
        by: ['source'],
        where,
        _count: { id: true }
      }),
      prisma.crmLead.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*)::int as count
        FROM "crm_leads"
        WHERE "businessId" = ${businessId}
          ${startDate ? prisma.$queryRaw`AND "createdAt" >= ${new Date(startDate)}` : prisma.$queryRaw``}
          ${endDate ? prisma.$queryRaw`AND "createdAt" <= ${new Date(endDate)}` : prisma.$queryRaw``}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    return {
      total: totalLeads,
      bySource: leadsBySource.reduce((acc, item) => {
        acc[item.source] = item._count.id;
        return acc;
      }, {}),
      recent: recentLeads,
      byDay: leadsByDay
    };
  }

  /**
   * Get leads by activity type (for admin)
   */
  async getLeadsByActivityType(businessId, activityType) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { activityType: true }
    });

    if (!business) {
      return [];
    }

    // Get leads with matching activity type context
    const leads = await prisma.crmLead.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });

    // Filter by activity type context in requestSummary
    const activityKeywords = this.getActivityKeywords(activityType);
    return leads.filter(lead => {
      const summary = lead.requestSummary.toLowerCase();
      return activityKeywords.some(keyword => summary.includes(keyword));
    });
  }

  /**
   * Get activity-specific keywords for filtering
   */
  getActivityKeywords(activityType) {
    const keywords = {
      'RESTAURANT': ['طعام', 'أكل', 'مطعم', 'حجز', 'طاولة', 'قائمة', 'طلب'],
      'CLINIC': ['موعد', 'طبيب', 'استشارة', 'علاج', 'فحص', 'مرض'],
      'HOTEL': ['حجز', 'غرفة', 'فندق', 'إقامة', 'سكن'],
      'RETAIL': ['منتج', 'شراء', 'سعر', 'عرض', 'تخفيض'],
      'ECOMMERCE': ['طلب', 'شراء', 'منتج', 'سلة', 'تسوق'],
      'SALON': ['موعد', 'صالون', 'تجميل', 'قص', 'صبغة'],
      'GYM': ['اشتراك', 'نادي', 'رياضة', 'تمرين', 'لياقة'],
      'EDUCATION': ['دورة', 'تدريب', 'تعليم', 'تسجيل', 'برنامج']
    };

    return keywords[activityType] || ['استفسار', 'طلب', 'خدمة'];
  }

  /**
   * Bulk update leads
   */
  async bulkUpdateLeads(businessId, leadIds, updates) {
    // Only allow certain fields to be bulk-updated
    const allowed = ['status', 'assignedTo'];
    const keys = Object.keys(updates || {});
    for (const k of keys) {
      if (!allowed.includes(k)) throw new Error(`Invalid update field: ${k}`);
    }

    // If assigning to a user, validate the user exists and belongs to the business (or is SUPERADMIN)
    if (updates && updates.assignedTo) {
      const user = await prisma.user.findUnique({ where: { id: updates.assignedTo } });
      if (!user) throw new Error('User not found');
      if (user.role !== 'SUPERADMIN' && user.employerId !== businessId) {
        throw new Error('User does not belong to the business');
      }
    }

    return await prisma.crmLead.updateMany({
      where: {
        businessId,
        id: { in: leadIds }
      },
      data: updates
    });
  }

  /**
   * Delete lead
   */
  async deleteLead(businessId, leadId) {
    return await prisma.crmLead.delete({
      where: {
        id: leadId,
        businessId
      }
    });
  }

  /**
   * Add a note to a lead
   */
  async addNote(businessId, leadId, authorId, message) {
    // Ensure the lead belongs to the business
    const lead = await prisma.crmLead.findFirst({ where: { id: leadId, businessId } });
    if (!lead) throw new Error('Lead not found');

    return await prisma.crmLeadNote.create({
      data: {
        leadId,
        authorId,
        message
      }
    });
  }

  /**
   * Get notes for a lead
   */
  async getNotes(businessId, leadId) {
    const lead = await prisma.crmLead.findFirst({ where: { id: leadId, businessId } });
    if (!lead) return [];

    return await prisma.crmLeadNote.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, name: true, email: true } } }
    });
  }

  /**
   * Assign lead to a user (agent)
   */
  async assignLead(businessId, leadId, userId) {
    const lead = await prisma.crmLead.findFirst({ where: { id: leadId, businessId } });
    if (!lead) throw new Error('Lead not found');

    // Validate the user exists and belongs to the business (or is SUPERADMIN)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (user.role !== 'SUPERADMIN' && user.employerId !== businessId) {
      throw new Error('User does not belong to the business');
    }

    return await prisma.crmLead.update({ where: { id: leadId }, data: { assignedTo: userId } });
  }

  /**
   * Update lead status
   */
  async updateStatus(businessId, leadId, status) {
    const lead = await prisma.crmLead.findFirst({ where: { id: leadId, businessId } });
    if (!lead) throw new Error('Lead not found');

    return await prisma.crmLead.update({ where: { id: leadId }, data: { status } });
  }

  /**
   * Get lead by ID
   */
  async getLeadById(businessId, leadId) {
    return await prisma.crmLead.findFirst({
      where: {
        id: leadId,
        businessId
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            activityType: true
          }
        },
        assigned: {
          select: { id: true, name: true, email: true }
        },
        // include last 10 notes
        _count: true,
        // lightweight notes preview
        // (notes are fetched with separate endpoint when needed)
      }
    });
  }
}

export default new CrmService();