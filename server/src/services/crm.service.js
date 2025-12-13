/**
 * CRM Service
 * Handles Customer Relationship Management operations
 */

const prisma = require('../config/database');

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
    return await prisma.business.update({
      where: { id: businessId },
      data: { crmLeadCollectionEnabled: enabled }
    });
  }
}

module.exports = new CrmService();