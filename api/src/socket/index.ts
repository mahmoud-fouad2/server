import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AIService } from '../services/ai.service.js';
import prisma from '../config/database.js';

const aiService = new AIService();

export class SocketService {
  private io: SocketIOServer;

  constructor(httpServer: HttpServer) {
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
      }
    });

    this.initialize();
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log('New client connected:', socket.id);

      socket.on('join_room', (room: string) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      });

      socket.on('join_conversation', (conversationId: string) => {
        socket.join(conversationId);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
      });

      socket.on('send_message', async (data: any) => {
        await this.handleMessage(socket, data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private async handleMessage(socket: Socket, data: any) {
    const { businessId, content, senderType, visitorId, conversationId } = data;

    if (!businessId || !content) return;

    try {
      let targetConversationId = conversationId;

      // 1. Find or Create Conversation
      if (!targetConversationId) {
        if (!visitorId) {
            socket.emit('error', { message: 'Visitor ID required for new conversation' });
            return;
        }
        
        // Check for active conversation
        const existing = await prisma.conversation.findFirst({
            where: { businessId, visitorId, status: 'active' }
        });

        if (existing) {
            targetConversationId = existing.id;
        } else {
            const newConv = await prisma.conversation.create({
                data: { businessId, visitorId, status: 'active' }
            });
            targetConversationId = newConv.id;
        }
      }

      // 2. Save User Message
      await prisma.message.create({
        data: {
            conversationId: targetConversationId,
            content,
            sender: senderType || 'visitor',
            type: 'text'
        }
      });
      
      // Emit to room (business dashboard + visitor)
      this.io.to(targetConversationId).emit('receive_message', {
        conversationId: targetConversationId,
        content,
        sender: senderType || 'visitor',
        timestamp: new Date()
      });

      // 3. Generate AI Response (if message is from visitor)
      if (senderType === 'visitor') {
          const responseText = await aiService.generateResponse(businessId, content);

          // Save Bot Message
          await prisma.message.create({
            data: {
                conversationId: targetConversationId,
                content: responseText,
                sender: 'bot',
                type: 'text'
            }
          });

          // Emit AI Response
          this.io.to(targetConversationId).emit('receive_message', {
            conversationId: targetConversationId,
            content: responseText,
            sender: 'bot',
            timestamp: new Date()
          });
      }

    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  }
}
