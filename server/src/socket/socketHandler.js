const prisma = require('../config/database');
const logger = require('../utils/logger');
const aiService = require('../services/ai.service');

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

        // Check Message Quota with detailed feedback
        if (business.messagesUsed >= business.messageQuota) {
          const planNames = {
            TRIAL: 'التجريبية',
            BASIC: 'الأساسية',
            PRO: 'الاحترافية',
            ENTERPRISE: 'المؤسسات'
          };
          
          const upgradeMessage = business.planType === 'TRIAL' 
            ? 'يمكنك الترقية للباقة الأساسية (5,000 رسالة/شهر) بسعر 99 ريال شهرياً.'
            : business.planType === 'BASIC'
            ? 'يمكنك الترقية للباقة الاحترافية (25,000 رسالة/شهر) بسعر 299 ريال شهرياً.'
            : 'يمكنك الترقية للباقة المؤسسات (غير محدود) بسعر 999 ريال شهرياً.';

          socket.emit('receive_message', { 
            role: 'assistant', 
            content: `عذراً، لقد استهلكت رصيد الرسائل المتاح في الباقة ${planNames[business.planType]} (${business.messageQuota} رسالة/شهر).\n\n${upgradeMessage}\n\nللترقية، تواصل معنا على: support@faheemly.com`,
            quotaExceeded: true,
            currentPlan: business.planType,
            used: business.messagesUsed,
            quota: business.messageQuota
          });
          
          logger.warn('Message quota exceeded', {
            businessId,
            planType: business.planType,
            used: business.messagesUsed,
            quota: business.messageQuota
          });
          
          return;
        }

        // Warn if approaching quota (90%)
        const usagePercent = (business.messagesUsed / business.messageQuota) * 100;
        if (usagePercent >= 90 && usagePercent < 100) {
          logger.warn('Approaching message quota', {
            businessId,
            usagePercent: usagePercent.toFixed(2),
            remaining: business.messageQuota - business.messagesUsed
          });
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

        // Format conversation for the hybrid AI service
        const formattedHistory = history.reverse().map(msg => ({
          role: msg.role === 'USER' ? 'user' : 'assistant',
          content: msg.content
        }));

        const systemPrompt = `You are the official assistant for ${business.name}. Keep answers concise and helpful.`;
        const messages = [
          { role: 'system', content: systemPrompt },
          ...formattedHistory,
          { role: 'user', content }
        ];

        const aiResult = await aiService.generateResponse(messages);

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

        // Update business message count (defensive)
        try {
          await prisma.business.update({
            where: { id: businessId },
            data: { messagesUsed: { increment: 1 } }
          });
        } catch (e) {
          // Prisma P2025 = Record to update not found
          if (e && e.code === 'P2025') {
            logger.warn('Failed to update business usage: business not found', { businessId });
          } else {
            logger.error('Unexpected error updating business usage', e);
          }
        }

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
