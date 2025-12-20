import prisma from '../config/database';

export class IntegrationService {
  async getIntegrations(businessId: string) {
    const [telegram, whatsapp, others] = await Promise.all([
      prisma.telegramIntegration.findUnique({ where: { businessId } }),
      prisma.whatsAppIntegration.findUnique({ where: { businessId } }),
      prisma.integration.findMany({ where: { businessId } }),
    ]);

    return {
      telegram,
      whatsapp,
      others,
    };
  }

  async updateTelegram(businessId: string, data: { botToken: string }) {
    return prisma.telegramIntegration.upsert({
      where: { businessId },
      update: { botToken: data.botToken, isActive: true },
      create: { businessId, botToken: data.botToken, isActive: true },
    });
  }

  async updateWhatsApp(businessId: string, data: { phoneNumberId: string; accessToken: string; verifyToken: string }) {
    return prisma.whatsAppIntegration.upsert({
      where: { businessId },
      update: { ...data, isActive: true },
      create: { businessId, ...data, isActive: true },
    });
  }

  async removeIntegration(businessId: string, type: 'telegram' | 'whatsapp') {
    if (type === 'telegram') {
      return prisma.telegramIntegration.delete({ where: { businessId } });
    } else if (type === 'whatsapp') {
      return prisma.whatsAppIntegration.delete({ where: { businessId } });
    }
  }
}
