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
      const businessId = req.user.businessId;
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
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const { businessId, conversationId, content, senderType, visitorId } = req.body;
      
      // Basic validation
      if (!businessId || !content) {
        return res.status(400).json({ error: 'Missing required fields: businessId and content are required' });
      }

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
      const { businessId, conversationId, rating } = req.body;
      
      if (!conversationId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Valid conversationId and rating (1-5) required' });
      }

      // Update conversation with rating
      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          metadata: JSON.stringify({ 
            ...JSON.parse((await prisma.conversation.findUnique({ where: { id: conversationId } }))?.metadata as string || '{}'),
            rating,
            ratedAt: new Date().toISOString()
          })
        }
      });

      res.json({ success: true, rating, conversationId });
    } catch (error) {
      console.error('Rate Conversation Error:', error);
      res.status(500).json({ error: 'Failed to save rating' });
    }
  }
}
