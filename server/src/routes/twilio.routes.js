const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const prisma = require('../config/database');
const groqService = require('../services/groq.service');
const logger = require('../utils/logger');

// Helper to get Twilio Client dynamically
const getTwilioClient = async () => {
  // Try to get from DB first
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'] }
    }
  });
  
  const sid = settings.find(s => s.key === 'TWILIO_ACCOUNT_SID')?.value || process.env.TWILIO_ACCOUNT_SID;
  const token = settings.find(s => s.key === 'TWILIO_AUTH_TOKEN')?.value || process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error('Twilio credentials not configured');
  }

  return twilio(sid, token);
};

// Webhook for Incoming WhatsApp Messages
router.post('/webhook', async (req, res) => {
  try {
    const { From, Body, ProfileName } = req.body;
    
    // From format is usually "whatsapp:+1234567890"
    const phoneNumber = From.replace('whatsapp:', '');
    
    console.log(`[Twilio] Received message from ${phoneNumber}: ${Body}`);

    // 1. Find the Business associated with this Twilio number
    // For this demo, we'll assume a single business or look up via Integration table
    // In a real multi-tenant app, you'd map the 'To' number to a Business
    const integration = await prisma.integration.findFirst({
      where: { 
        type: 'WHATSAPP',
        isActive: true
        // In real app: config->>'$.phoneNumber' === req.body.To.replace('whatsapp:', '')
      },
      include: { business: true }
    });

    // Fallback for demo: Use the first active business if no integration found
    let business = integration?.business;
    if (!business) {
      business = await prisma.business.findFirst({
        where: { status: 'ACTIVE' }, // Just for demo purposes
        include: { knowledgeBase: true }
      });
    }

    if (!business) {
      console.error('[Twilio] No business found to handle message');
      return res.status(200).send('<Response></Response>'); // Acknowledge to stop retries
    }

    // 2. Find or Create Conversation
    let conversation = await prisma.conversation.findFirst({
      where: { 
        businessId: business.id,
        channel: 'WHATSAPP',
        externalId: phoneNumber,
        status: { not: 'CLOSED' }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          businessId: business.id,
          channel: 'WHATSAPP',
          externalId: phoneNumber,
          status: 'ACTIVE'
        }
      });
    }

    // 3. Save User Message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: Body
      }
    });

    // 4. Generate AI Response
    // Get History
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const formattedHistory = history.reverse().map(msg => ({
      role: msg.role === 'USER' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Parse config
    let widgetConfig = {};
    try {
      widgetConfig = typeof business.widgetConfig === 'string' 
        ? JSON.parse(business.widgetConfig) 
        : business.widgetConfig || {};
    } catch (e) { logger.warn('Failed to parse widgetConfig', { error: e.message }); }

    // Generate
    const aiResult = await groqService.generateChatResponse(
      Body,
      { ...business, widgetConfig },
      formattedHistory,
      business.knowledgeBase || [] // In real app, fetch KB
    );

    // 5. Save AI Response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: aiResult.response,
        tokensUsed: aiResult.tokensUsed || 0,
        aiModel: aiResult.model
      }
    });

    // 6. Send Reply via Twilio
    const client = await getTwilioClient();
    await client.messages.create({
      from: req.body.To, // Reply from the same number
      to: From,
      body: aiResult.response
    });

    // Update usage (defensive)
    try {
      await prisma.business.update({
        where: { id: business.id },
        data: { messagesUsed: { increment: 1 } }
      });
    } catch (e) {
      if (e && e.code === 'P2025') {
        console.warn('[Twilio] Business not found when updating usage', { businessId: business.id });
      } else {
        console.error('[Twilio] Error updating business usage', e);
      }
    }

    res.status(200).send('<Response></Response>');

  } catch (error) {
    console.error('[Twilio] Webhook Error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
