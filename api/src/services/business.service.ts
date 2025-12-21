import prisma from '../config/database.js';
import { WidgetConfigSchema } from '../shared_local/index.js';

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

  async getStats(businessId: string) {
    const [conversations, messages, leads, tickets, knowledge] = await Promise.all([
      prisma.conversation.count({ where: { businessId } }),
      prisma.message.count({ where: { conversation: { businessId } } }),
      prisma.crmLead.count({ where: { businessId } }).catch(() => 0),
      prisma.ticket.count({ where: { businessId } }).catch(() => 0),
      prisma.knowledgeBase.count({ where: { businessId } }).catch(() => 0),
    ]);

    return {
      conversations,
      messages,
      leads,
      tickets,
      knowledge,
    };
  }

  async getSettings(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        language: true,
        botTone: true,
        planType: true,
        status: true,
        primaryColor: true,
        widgetVariant: true,
        widgetConfig: true,
        preChatFormEnabled: true,
        crmLeadCollectionEnabled: true,
      }
    });

    if (!business) return null;

    let widgetConfig: any = {};
    try {
      widgetConfig = business.widgetConfig ? JSON.parse(business.widgetConfig) : {};
    } catch (e) {
      widgetConfig = {};
    }

    // Ensure a sane shape for the dashboard
    const normalizedWidgetConfig = WidgetConfigSchema.safeParse(widgetConfig).success
      ? WidgetConfigSchema.parse(widgetConfig)
      : WidgetConfigSchema.parse({});

    return {
      ...business,
      widgetConfig: normalizedWidgetConfig,
    };
  }

  async updateSettings(businessId: string, data: any) {
    const incoming = (data && typeof data === 'object') ? data : {};

    // widgetConfig can be sent either as an object or string
    let widgetConfigObj: any | null = null;
    if (incoming.widgetConfig !== undefined) {
      if (typeof incoming.widgetConfig === 'string') {
        try {
          widgetConfigObj = JSON.parse(incoming.widgetConfig);
        } catch (e) {
          widgetConfigObj = null;
        }
      } else if (typeof incoming.widgetConfig === 'object' && incoming.widgetConfig) {
        widgetConfigObj = incoming.widgetConfig;
      }
    }

    const updateData: any = {
      ...(incoming.name ? { name: incoming.name } : {}),
      ...(incoming.primaryColor ? { primaryColor: incoming.primaryColor } : {}),
      ...(incoming.botTone ? { botTone: incoming.botTone } : {}),
      ...(typeof incoming.preChatFormEnabled === 'boolean' ? { preChatFormEnabled: incoming.preChatFormEnabled } : {}),
      ...(typeof incoming.crmLeadCollectionEnabled === 'boolean' ? { crmLeadCollectionEnabled: incoming.crmLeadCollectionEnabled } : {}),
    };

    if (widgetConfigObj) {
      const validated = WidgetConfigSchema.partial().parse(widgetConfigObj);
      const existing = await prisma.business.findUnique({
        where: { id: businessId },
        select: { widgetConfig: true },
      });
      let current: any = {};
      try {
        current = existing?.widgetConfig ? JSON.parse(existing.widgetConfig) : {};
      } catch (e) {
        current = {};
      }
      const merged = WidgetConfigSchema.parse({ ...current, ...validated });
      updateData.widgetConfig = JSON.stringify(merged);
      // keep top-level color aligned
      if (merged.primaryColor) updateData.primaryColor = merged.primaryColor;
    }

    return prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        name: true,
        primaryColor: true,
        widgetVariant: true,
        widgetConfig: true,
        preChatFormEnabled: true,
        crmLeadCollectionEnabled: true,
      },
    });
  }

  async updatePlan(businessId: string, data: any) {
    const planType = data?.planType;
    if (!planType) {
      return prisma.business.findUnique({ where: { id: businessId } });
    }
    return prisma.business.update({
      where: { id: businessId },
      data: { planType },
    });
  }

  async updatePreChatSettings(businessId: string, data: { preChatFormEnabled?: boolean }) {
    if (typeof data.preChatFormEnabled !== 'boolean') {
      return prisma.business.findUnique({ where: { id: businessId } });
    }
    return prisma.business.update({
      where: { id: businessId },
      data: { preChatFormEnabled: data.preChatFormEnabled },
      select: { id: true, preChatFormEnabled: true },
    });
  }

  async getChartData(businessId: string) {
    // Simple trend: messages per day last 30 days
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const messages = await prisma.message.findMany({
      where: {
        conversation: { businessId },
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    });

    const trendsMap: Record<string, number> = {};
    for (const msg of messages as any[]) {
      const date = msg.createdAt.toISOString().split('T')[0];
      trendsMap[date] = (trendsMap[date] || 0) + 1;
    }

    const trends = Object.keys(trendsMap)
      .map((date) => ({ date, count: trendsMap[date] }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { trends };
  }

  async getConversations(businessId: string) {
    return prisma.conversation.findMany({
      where: { businessId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      }
    });
  }
}
