import twilio from 'twilio';
import logger from '../utils/logger.js';
import { Channel, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class WhatsAppService {
  private client: any;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      logger.info('✅ WhatsApp service initialized');
    } else {
      logger.warn('WhatsApp service not configured (missing Twilio credentials)');
    }
  }

  async sendMessage(to: string, message: string, from?: string): Promise<boolean> {
    if (!this.client) {
      logger.error('WhatsApp client not initialized');
      return false;
    }

    try {
      const fromNumber = from || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      await this.client.messages.create({
        body: message,
        from: fromNumber,
        to: toNumber,
      });

      logger.info(`WhatsApp message sent to ${to}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send WhatsApp message:', error.message);
      return false;
    }
  }

  async sendMediaMessage(
    to: string,
    message: string,
    mediaUrl: string,
    from?: string
  ): Promise<boolean> {
    if (!this.client) {
      logger.error('WhatsApp client not initialized');
      return false;
    }

    try {
      const fromNumber = from || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      await this.client.messages.create({
        body: message,
        from: fromNumber,
        to: toNumber,
        mediaUrl: [mediaUrl],
      });

      logger.info(`WhatsApp media message sent to ${to}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send WhatsApp media message:', error.message);
      return false;
    }
  }

  async handleIncomingMessage(from: string, body: string, businessId: string): Promise<any> {
    try {
      // Find or create conversation
      const phoneNumber = from.replace('whatsapp:', '');
      
      let conversation = await prisma.conversation.findFirst({
        where: {
          businessId,
          externalId: phoneNumber,
           channel: Channel.WHATSAPP,
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            businessId,
            externalId: phoneNumber,
             channel: Channel.WHATSAPP,
            status: 'ACTIVE',
          },
        });
      }

      // Save user message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          sender: 'user',
          content: body,
        },
      });

      return conversation;
    } catch (error: any) {
      logger.error('Failed to handle incoming WhatsApp message:', error.message);
      return null;
    }
  }

  async getIntegrationStatus(businessId: string): Promise<any> {
    try {
      const integration = await prisma.whatsAppIntegration.findUnique({
        where: { businessId },
      });

      return integration || null;
    } catch (error: any) {
      logger.error('Failed to get WhatsApp integration status:', error.message);
      return null;
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }
}

export default new WhatsAppService();
