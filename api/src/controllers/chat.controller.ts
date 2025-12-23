import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service.js';
import { AIService } from '../services/ai.service.js';
import prisma from '../config/database.js';

const chatService = new ChatService();
const aiService = new AIService();

export class ChatController {
  
  async getConversations(req: Request, res: Response) {
    try {
      // @ts-ignore
      const businessId = req.user?.businessId;
      if (!businessId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const conversations = await prisma.conversation.findMany({
        where: { businessId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });
      res.json({ success: true, data: conversations, count: conversations.length });
    } catch (error) {
      console.error('Conversations fetch error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch conversations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      if (!conversationId) {
        return res.status(400).json({ error: 'Conversation ID required' });
      }
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
      });
      res.json({ success: true, data: messages, count: messages.length });
    } catch (error) {
      console.error('Messages fetch error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch messages',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const { SendMessageSchema } = await import('@fahimo/shared');
      const {
        businessId,
        conversationId,
        content,
        senderType,
        visitorId,
        visitorSessionId,
        preChatData,
      } = SendMessageSchema.parse(req.body);

      const resolvedVisitorId = await this.resolveVisitorIdentity(
        visitorId ?? null,
        conversationId ?? null,
        visitorSessionId ?? null
      );

      const metadataPayload: Record<string, unknown> = {};
      if (visitorSessionId) metadataPayload.visitorSessionId = visitorSessionId;
      if (preChatData && Object.keys(preChatData).length) {
        metadataPayload.preChatData = preChatData;
      }

      // 1. Save user message (creates conversation if needed)
      const userMessage = await chatService.saveMessage(
        businessId, 
        conversationId || null, 
        content, 
        senderType || 'USER',
        resolvedVisitorId ?? undefined,
        Object.keys(metadataPayload).length ? metadataPayload : undefined
      );

      const activeConversationId = userMessage.conversationId;

      if (preChatData && Object.keys(preChatData).length) {
        await this.applyPreChatMetadata(
          activeConversationId,
          resolvedVisitorId,
          preChatData,
          visitorSessionId
        );
      } else if (visitorSessionId) {
        await this.mergeConversationMetadata(activeConversationId, { visitorSessionId });
      }

      // 2. Generate AI response for USER messages
      if (senderType === 'USER' || !senderType) {
        try {
          // Get conversation history for context
          const history = await chatService.getHistory(activeConversationId, 10, false);
          
          // Generate AI response
          const aiResponse = await aiService.generateResponse(
            businessId,
            content,
            history.map((m: any) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content })),
            {
              conversationId: activeConversationId,
              messageId: userMessage.id,
              useVectorSearch: true,
              detectIntent: true,
              analyzeSentiment: true,
              detectLanguage: true
            }
          );

          // Save bot response
          const botMessage = await chatService.saveMessage(
            businessId,
            activeConversationId,
            aiResponse,
            'BOT'
          );

          // Return both user message and AI response
          return res.json({
            conversationId: activeConversationId,
            userMessage: {
              id: userMessage.id,
              content: userMessage.content,
              sender: userMessage.sender,
              createdAt: userMessage.createdAt
            },
            botMessage: {
              id: botMessage.id,
              content: botMessage.content,
              sender: botMessage.sender,
              createdAt: botMessage.createdAt
            },
            // Legacy field for backward compatibility
            content: aiResponse
          });
        } catch (aiError) {
          console.error('AI Response Generation Error:', aiError);
          // Return user message even if AI fails
          return res.json({
            conversationId: activeConversationId,
            userMessage: {
              id: userMessage.id,
              content: userMessage.content,
              sender: userMessage.sender,
              createdAt: userMessage.createdAt
            },
            content: 'I apologize, but I am having trouble processing your request right now. Please try again.',
            error: 'AI generation failed'
          });
        }
      }

      // For non-user messages (agent messages), just return the saved message
      res.json({
        conversationId: activeConversationId,
        message: userMessage
      });
    } catch (error) {
      console.error('Send Message Error:', error);
      res.status(500).json({ error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async requestHandoff(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const { reason, priority } = req.body;
      
      const result = await chatService.requestAgentHandoff(conversationId, reason, priority);
      res.json(result);
    } catch (error) {
      console.error('Request Handoff Error:', error);
      res.status(500).json({ error: 'Failed to request handoff' });
    }
  }

  // Demo endpoint for marketing/demo widget - returns canned response quickly
  async demoChat(req: Request, res: Response) {
    try {
      const { message } = req.body as { message?: string };
      if (!message || typeof message !== 'string') return res.status(400).json({ error: 'Message is required' });

      // Simple canned dialogue to showcase features without requiring AI providers
      const canned = [
        { sender: 'BOT', content: 'أهلاً! أنا مساعد فهملي، كيف أساعدك اليوم؟' },
        { sender: 'BOT', content: `لقد استلمت رسالتك: "${String(message).slice(0, 120)}". تستطيع تجربة الأسئلة الشائعة أو الضغط على الخيارات.` },
        { sender: 'BOT', content: 'هذه المحادثة تعمل على وضع العرض التوضيحي وليس على نظام الإنتاج.' }
      ];

      return res.json({ success: true, botReplies: canned });
    } catch (error) {
      console.error('Demo Chat Error:', error);
      res.status(500).json({ error: 'Demo chat failed' });
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const analytics = await chatService.getConversationAnalytics(conversationId);
      res.json(analytics);
    } catch (error) {
      console.error('Analytics Error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  async rateConversation(req: Request, res: Response) {
    try {
      const { RateConversationSchema } = await import('@fahimo/shared');
      const { conversationId, rating } = RateConversationSchema.parse(req.body);

      // Update conversation with rating
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          agentRating: rating,
        },
        // Avoid selecting columns that may not exist yet in production DB
        select: { id: true },
      });

      res.json({ success: true, rating, conversationId });
    } catch (error) {
      console.error('Rate Conversation Error:', error);
      res.status(500).json({ error: 'Failed to save rating' });
    }
  }

  async getHandoverRequests(req: Request, res: Response) {
    try {
      // Prefer x-business-id (dashboard sends it) then fall back to req.user
      const businessId = (req.headers['x-business-id'] as string) || (req as any).user?.businessId;
      if (!businessId) return res.status(401).json({ error: 'Unauthorized - Business ID required' });

      const requests = await prisma.agentHandoff.findMany({
        where: {
          businessId: String(businessId),
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          conversation: true,
        },
      });

      res.json({ success: true, data: requests, count: requests.length });
    } catch (error) {
      console.error('Get Handover Requests Error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch handover requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async markConversationRead(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      if (!conversationId) return res.status(400).json({ error: 'conversationId required' });

      // Read tracking is not modeled yet; keep endpoint for dashboard compatibility.
      res.json({ success: true, conversationId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark conversation read' });
    }
  }

  private async resolveVisitorIdentity(
    visitorId: string | null,
    conversationId: string | null,
    visitorSessionId: string | null
  ): Promise<string | null> {
    if (visitorId) return visitorId;

    if (visitorSessionId) {
      const session = await prisma.visitorSession.findUnique({
        where: { id: visitorSessionId },
        select: { visitorId: true },
      });
      if (session?.visitorId) {
        return session.visitorId;
      }
    }

    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { visitorId: true },
      });
      if (conversation?.visitorId) {
        return conversation.visitorId;
      }
    }

    return null;
  }

  private async applyPreChatMetadata(
    conversationId: string,
    visitorId: string | null,
    preChatData: Record<string, string>,
    visitorSessionId?: string | null
  ) {
    if (!preChatData || !Object.keys(preChatData).length) return;

    await Promise.all([
      this.mergeConversationMetadata(conversationId, {
        preChatData,
        ...(visitorSessionId ? { visitorSessionId } : {}),
      }),
      this.updateVisitorProfile(visitorId, preChatData),
    ]);
  }

  private async mergeConversationMetadata(
    conversationId: string,
    patch: Record<string, unknown>
  ) {
    if (!conversationId || !Object.keys(patch).length) return;

    try {
      const existing = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { metadata: true },
      });

      let current: Record<string, unknown> = {};
      if (existing?.metadata) {
        try {
          current = JSON.parse(existing.metadata);
        } catch (error) {
          current = {};
        }
      }

      const next: Record<string, unknown> = {
        ...current,
        ...patch,
      };

      if (patch.preChatData) {
        const existingPreChat = (current.preChatData as Record<string, string> | undefined) || {};
        next.preChatData = {
          ...existingPreChat,
          ...(patch.preChatData as Record<string, string>),
        };
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { metadata: JSON.stringify(next) },
        select: { id: true },
      });
    } catch (error) {
      console.error('Conversation metadata merge failed:', error);
    }
  }

  private async updateVisitorProfile(
    visitorId: string | null,
    preChatData: Record<string, string>
  ) {
    if (!visitorId) return;

    const payload: Record<string, string> = {};
    if (preChatData.name?.trim()) payload.name = preChatData.name.trim();
    if (preChatData.email?.trim()) payload.email = preChatData.email.trim();
    if (preChatData.phone?.trim()) payload.phone = preChatData.phone.trim();

    if (!Object.keys(payload).length) return;

    try {
      await prisma.visitor.update({ where: { id: visitorId }, data: payload });
    } catch (error) {
      console.error('Visitor profile enrichment failed:', error);
    }
  }
}
