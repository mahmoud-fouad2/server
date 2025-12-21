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
      const { businessId, conversationId, content, senderType, visitorId } = SendMessageSchema.parse(req.body);

      // 1. Save user message (creates conversation if needed)
      const userMessage = await chatService.saveMessage(
        businessId, 
        conversationId || null, 
        content, 
        senderType || 'USER',
        visitorId
      );

      const activeConversationId = userMessage.conversationId;

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
}
