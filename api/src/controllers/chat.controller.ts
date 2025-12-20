import { Request, Response } from 'express';
import { ChatService } from '../services/chat.service.js';
import prisma from '../config/database.js';

const chatService = new ChatService();

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
      const { businessId, conversationId, content, senderType } = req.body;
      
      // Basic validation
      if (!businessId || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const message = await chatService.saveMessage(businessId, conversationId, content, senderType || 'USER');
      res.json(message);
    } catch (error) {
      console.error('Send Message Error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
}
