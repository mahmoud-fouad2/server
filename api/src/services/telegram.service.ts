import axios from 'axios';
import logger from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class TelegramService {
  private botTokens: Map<string, string> = new Map();

  async sendMessage(botToken: string, chatId: string, message: string): Promise<boolean> {
    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      });

      logger.info(`Telegram message sent to ${chatId}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send Telegram message:', error.message);
      return false;
    }
  }

  async sendPhoto(
    botToken: string,
    chatId: string,
    photoUrl: string,
    caption?: string
  ): Promise<boolean> {
    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        chat_id: chatId,
        photo: photoUrl,
        caption,
      });

      logger.info(`Telegram photo sent to ${chatId}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send Telegram photo:', error.message);
      return false;
    }
  }

  async handleIncomingMessage(
    botToken: string,
    chatId: string,
    text: string,
    businessId: string
  ): Promise<any> {
    try {
      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          businessId,
          externalId: chatId,
          channel: 'TELEGRAM',
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            businessId,
            externalId: chatId,
            channel: 'TELEGRAM',
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
          content: text,
        },
      });

      return conversation;
    } catch (error: any) {
      logger.error('Failed to handle incoming Telegram message:', error.message);
      return null;
    }
  }

  async setWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        url: webhookUrl,
      });

      logger.info(`Telegram webhook set to ${webhookUrl}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to set Telegram webhook:', error.message);
      return false;
    }
  }

  async deleteWebhook(botToken: string): Promise<boolean> {
    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
      logger.info('Telegram webhook deleted');
      return true;
    } catch (error: any) {
      logger.error('Failed to delete Telegram webhook:', error.message);
      return false;
    }
  }

  async getBotInfo(botToken: string): Promise<any> {
    try {
      const response = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
      return response.data.result;
    } catch (error: any) {
      logger.error('Failed to get Telegram bot info:', error.message);
      return null;
    }
  }

  async getIntegrationStatus(businessId: string): Promise<any> {
    try {
      const integration = await prisma.telegramIntegration.findUnique({
        where: { businessId },
      });

      return integration || null;
    } catch (error: any) {
      logger.error('Failed to get Telegram integration status:', error.message);
      return null;
    }
  }
}

export default new TelegramService();
