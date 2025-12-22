import prisma from '../config/database.js';
import queueService from './queue.service.js';
import { cacheService } from './cache.service.js';
import agentHandoffService from './agent-handoff.service.js';
import logger from '../utils/logger.js';
import { Channel } from '@prisma/client';

export class ChatService {
  
  async saveMessage(
    businessId: string, 
    conversationId: string | null, 
    content: string, 
    senderType: 'USER' | 'BOT' | 'AGENT', 
    senderId?: string,
    metadata?: Record<string, any>
  ) {
    // If no conversationId, create a new one
    if (!conversationId) {
      const conversation = await prisma.conversation.create({
        data: {
          businessId,
          status: 'ACTIVE',
          channel: Channel.WIDGET,
        },
        // Avoid selecting columns that may not exist yet in production DB
        select: {
          id: true,
        },
      });
      conversationId = conversation.id;
      
      logger.info(`Created new conversation: ${conversationId}`);

      // Best-effort enrichment (non-blocking): these columns may not exist on older DBs.
      const channel = Channel.WIDGET;
      if (senderId) {
        prisma.conversation
          .update({
            where: { id: conversationId },
            data: {
              ...(channel ? { channel } : {}),
              ...(senderType === 'USER' && senderId ? { visitorId: senderId } : {}),
            },
            select: { id: true },
          })
          .catch(() => {});
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        sender: senderType === 'USER' ? 'user' : (senderType === 'AGENT' ? 'agent' : 'bot'),
        type: metadata?.type || 'text',
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      }
    });

    // Invalidate cache for this conversation
    await cacheService.del(`conversation:${conversationId}:history`).catch(() => {});
    
    // Queue background tasks for user messages (non-blocking)
    if (senderType === 'USER') {
      // Queue sentiment analysis (fire and forget)
      queueService.addJob('sentiment', 'analyze', {
        conversationId,
        messageId: message.id,
        text: content,
      }, { priority: 5 }).catch(err => logger.warn('Failed to queue sentiment job:', err));

      // Queue language detection (fire and forget)
      queueService.addJob('language-detection', 'detect', {
        conversationId,
        messageId: message.id,
        text: content,
      }, { priority: 5 }).catch(err => logger.warn('Failed to queue language detection job:', err));
    }

    // Return message with conversationId attached
    return { ...message, conversationId };
  }

  async getHistory(conversationId: string, limit: number = 50, useCache: boolean = true) {
    // Try cache first
    if (useCache) {
      const cached = await cacheService.get(`conversation:${conversationId}:history`);
      if (cached) {
        logger.info('Using cached conversation history');
        return JSON.parse(cached);
      }
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        sentimentAnalysis: true,
        languageDetection: true,
      }
    });

    // Cache for 5 minutes
    await cacheService.set(
      `conversation:${conversationId}:history`,
      JSON.stringify(messages),
      300
    );

    return messages;
  }

  async getConversation(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        visitor: true,
        agentHandoff: true
      }
    });
  }

  async updateConversationStatus(
    conversationId: string, 
    status: 'ACTIVE' | 'RESOLVED' | 'CLOSED' | 'WAITING_FOR_AGENT'
  ) {
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        status,
        updatedAt: new Date(),
      }
    });

    // Clear cache
    await cacheService.del(`conversation:${conversationId}:history`);

    logger.info(`Conversation ${conversationId} status updated to ${status}`);

    return conversation;
  }

  async requestAgentHandoff(
    conversationId: string,
    reason: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'
  ) {
    // Update conversation status
    const conversation = await this.updateConversationStatus(conversationId, 'WAITING_FOR_AGENT');

    // Request handoff through service
    const handoff = await agentHandoffService.requestHandoff({
      conversationId,
      businessId: conversation.businessId,
      reason,
      priority
    });

    logger.info(`Agent handoff requested for conversation ${conversationId}`);

    return handoff;
  }

  async getActiveConversations(businessId: string, filters?: {
    status?: string;
    channel?: string;
    agentId?: string;
  }) {
    const where: any = {
      businessId,
      status: filters?.status || { in: ['ACTIVE', 'WAITING_FOR_AGENT'] },
    };

    if (filters?.channel) {
      where.channel = filters.channel;
    }

    if (filters?.agentId) {
      where.assignedAgentId = filters.agentId;
    }

    return prisma.conversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        visitor: true,
        agentHandoff: true
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversationAnalytics(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          include: {
            sentimentAnalysis: true,
            languageDetection: true,
          }
        },
        agentHandoff: true,
      }
    });

    if (!conversation) return null;

    // Calculate analytics
    const totalMessages = conversation.messages.length;
    const userMessages = conversation.messages.filter(m => m.sender === 'user').length;
    const botMessages = conversation.messages.filter(m => m.sender === 'bot').length;
    const agentMessages = conversation.messages.filter(m => m.sender === 'agent').length;

    const sentiments = conversation.messages
      .filter(m => m.sentimentAnalysis)
      .map(m => m.sentimentAnalysis?.sentiment);
    
    const avgSentiment = sentiments.length > 0
      ? sentiments.filter((s: any) => s === 'positive').length / sentiments.length
      : 0;

    const languages = conversation.messages
      .filter(m => m.languageDetection)
      .map(m => m.languageDetection?.language);
    
    const primaryLanguage = languages.length > 0
      ? languages.sort((a: any, b: any) =>
          languages.filter((l: any) => l === a).length - languages.filter((l: any) => l === b).length
        ).pop()
      : 'unknown';

    return {
      conversationId,
      duration: conversation.updatedAt.getTime() - conversation.createdAt.getTime(),
      totalMessages,
      userMessages,
      botMessages,
      agentMessages,
      avgSentiment,
      primaryLanguage,
      hadAgentHandoff: !!conversation.agentHandoff,
      status: conversation.status,
    };
  }

  async searchConversations(businessId: string, query: string, limit: number = 20) {
    // Search in messages and conversations
    return prisma.conversation.findMany({
      where: {
        businessId,
        OR: [
          {
            messages: {
              some: {
                content: {
                  contains: query,
                  mode: 'insensitive',
                }
              }
            }
          },
          {
            visitor: {
              is: {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { email: { contains: query, mode: 'insensitive' } },
                ]
              }
            }
          }
        ]
      },
      include: {
        messages: {
          where: {
            content: { contains: query, mode: 'insensitive' }
          },
          take: 3,
        },
        visitor: true,
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
  }
}
