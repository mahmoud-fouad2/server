const prisma = require('../config/database');
const logger = require('../utils/logger');
const aiService = require('../services/aiService');

/**
 * Initialize Socket.IO handlers
 * @param {import('socket.io').Server} io 
 */
function initializeSocket(io) {
  io.on('connection', (socket) => {
    logger.debug('Widget connection established', { socketId: socket.id });

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`User joined room: ${room}`);
    });

    socket.on('send_message', async (data) => {
      try {
        const { businessId, content } = data;
        console.log('Message received:', data);

        if (!businessId || !content) {
          socket.emit('receive_message', {
            role: 'assistant',
            content: 'خطأ: الرسالة أو معرف العمل مفقود',
            timestamp: new Date()
          });
          return;
        }

        // Check Subscription Limits
        const business = await prisma.business.findUnique({ where: { id: businessId } });
        
        if (!business) {
          socket.emit('receive_message', { role: 'assistant', content: 'خطأ: حساب العمل غير موجود.' });
          return;
        }

        // Check Trial Expiry
        if (business.planType === 'TRIAL' && business.trialEndsAt && new Date() > new Date(business.trialEndsAt)) {
          socket.emit('receive_message', { 
            role: 'assistant', 
            content: 'عذراً، انتهت الفترة التجريبية. يرجى ترقية الباقة للمتابعة.' 
          });
          return;
        }

        // Check Message Quota
        if (business.messagesUsed >= business.messageQuota) {
          socket.emit('receive_message', { 
            role: 'assistant', 
            content: 'عذراً، لقد استهلكت رصيد الرسائل المتاح لهذا الشهر. يرجى الترقية.' 
          });
          return;
        }

        // Find or create conversation
        let conversation = await prisma.conversation.findFirst({
          where: { 
            businessId,
            channel: 'WIDGET',
            externalId: socket.id // Use socket ID as external ID
          }
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              businessId,
              channel: 'WIDGET',
              externalId: socket.id
            }
          });
        }

        // Save User Message
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'USER',
            content: content
          }
        });

        // Get Conversation History (last 10 messages)
        const history = await prisma.message.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: 'desc' },
          take: 10
        });

        // Generate AI Response using aiService
        const aiResult = await aiService.generateResponse(
          content, 
          businessId, 
          history.reverse()
        );

        // Save AI Message
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: aiResult.response,
            tokensUsed: aiResult.tokensUsed,
            wasFromCache: aiResult.fromCache,
            aiModel: aiResult.model || 'groq'
          }
        });

        // Update business message count
        await prisma.business.update({
          where: { id: businessId },
          data: {
            messagesUsed: {
              increment: 1
            }
          }
        });

        // Simulate "Thinking" Delay (1.5s - 3s) to feel more natural
        const delay = Math.floor(Math.random() * 1500) + 1500;
        await new Promise(resolve => setTimeout(resolve, delay));

        // Emit response back to client
        socket.emit('receive_message', {
          role: 'assistant',
          content: aiResult.response,
          timestamp: new Date(),
          fromCache: aiResult.fromCache
        });

      } catch (error) {
        logger.error('Socket message processing failed', error, { socketId: socket.id });
        socket.emit('receive_message', {
          role: 'assistant',
          content: 'عذراً، حدث خطأ أثناء معالجة رسالتك.',
          timestamp: new Date()
        });
      }
    });

    socket.on('disconnect', () => {
      logger.debug('Widget disconnected', { socketId: socket.id });
    });
  });
}

module.exports = initializeSocket;
