const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const logger = require('../utils/logger');
const telegramService = require('../services/telegram.service');
const groqService = require('../services/groq.service');
const vectorSearch = require('../services/vector-search.service');
const responseValidator = require('../services/response-validator.service');
const { authenticateToken } = require('../middleware/auth');

// Setup Telegram Bot (Client Action)
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // 1. Validate Token with Telegram
    const botInfo = await telegramService.getMe(token);
    if (!botInfo.ok) {
      return res.status(400).json({ error: 'Invalid Telegram Bot Token' });
    }

    // 2. Find User's Business
    const business = await prisma.business.findFirst({
      where: { userId: userId }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // 3. Create/Update Integration
    // Check if integration already exists
    let integration = await prisma.integration.findFirst({
      where: { 
        businessId: business.id,
        type: 'TELEGRAM'
      }
    });

    if (integration) {
      // Update existing
      integration = await prisma.integration.update({
        where: { id: integration.id },
        data: {
          config: { token, botInfo: botInfo.result },
          isActive: true
        }
      });
    } else {
      // Create new
      integration = await prisma.integration.create({
        data: {
          businessId: business.id,
          type: 'TELEGRAM',
          config: { token, botInfo: botInfo.result },
          isActive: true
        }
      });
    }

    // 4. Set Webhook
    // Construct Webhook URL: https://your-domain.com/api/telegram/webhook/{integrationId}
    // For local dev, we might need a tunnel URL. 
    // We'll use process.env.BASE_URL or fall back to a placeholder.
    const baseUrl = process.env.BASE_URL || 'https://api.faheemly.com'; 
    const webhookUrl = `${baseUrl}/api/telegram/webhook/${integration.id}`;
    
    await telegramService.setWebhook(token, webhookUrl);

    res.json({ success: true, bot: botInfo.result });

  } catch (error) {
    logger.error('Telegram Setup Error', { error });
    res.status(500).json({ error: 'Failed to setup Telegram bot' });
  }
});

// Webhook Handler
router.post('/webhook/:integrationId', async (req, res) => {
  const { integrationId } = req.params;
  
  try {
    // 1. Get Integration & Business
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: { business: true }
    });

    if (!integration || !integration.isActive || integration.type !== 'TELEGRAM') {
      return res.status(404).send('Integration not found or inactive');
    }

    const { token } = integration.config;
    const update = req.body;

    // Check if it's a message
    if (!update.message || !update.message.text) {
      return res.status(200).send('OK'); // Ignore non-text updates
    }

    const chatId = update.message.chat.id;
    const text = update.message.text;
    const senderName = update.message.from.first_name;

    logger.debug(`[Telegram] Msg from ${senderName}`, { chatId, textLength: text.length });

    // 2. Find/Create Conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        businessId: integration.businessId,
        channel: 'TELEGRAM',
        externalId: String(chatId),
        status: { not: 'CLOSED' }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          businessId: integration.businessId,
          channel: 'TELEGRAM',
          externalId: String(chatId),
          status: 'ACTIVE'
        }
      });
    }

    // 3. Save User Message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: text
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
      widgetConfig = typeof integration.business.widgetConfig === 'string' 
        ? JSON.parse(integration.business.widgetConfig) 
        : integration.business.widgetConfig || {};
    } catch (e) { logger.warn('Failed to parse widgetConfig', { error: e.message }); }

    // Get knowledge base context (same as chat controller)
    let knowledgeContext = [];
    try {
      knowledgeContext = await vectorSearch.searchKnowledge(text, integration.businessId, 5);
      logger.debug(`[Telegram] Found ${knowledgeContext.length} knowledge chunks`);
    } catch (vectorError) {
      logger.warn('[Telegram] Vector search failed', { error: vectorError.message });
      // Fallback to recent knowledge base entries
      try {
        const fallbackKnowledge = await prisma.knowledgeBase.findMany({
          where: { businessId: integration.businessId },
          orderBy: { createdAt: 'desc' },
          take: 3
        });
        knowledgeContext = fallbackKnowledge.map(kb => ({
          id: kb.id,
          businessId: kb.businessId,
          content: kb.content,
          metadata: kb.metadata
        }));
      } catch (fallbackError) {
        logger.error('[Telegram] Fallback knowledge search failed', fallbackError);
        knowledgeContext = [];
      }
    }

    // Add current date for context
    const businessWithContext = {
      ...integration.business,
      widgetConfig,
      currentDate: new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })
    };

    // Generate using unified method with conversation state tracking
    const aiResult = await groqService.generateChatResponse(
      text,
      businessWithContext,
      formattedHistory,
      knowledgeContext,
      conversation.id // Pass conversationId for state tracking
    );

    // Sanitize response
    const sanitized = responseValidator.sanitizeResponse(aiResult.response || '');

    // 5. Save AI Response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: sanitized,
        tokensUsed: aiResult.tokensUsed || 0,
        aiModel: aiResult.model || 'groq-llama',
        wasFromCache: false
      }
    });

    // 6. Send Reply
    await telegramService.sendMessage(token, chatId, sanitized);

    // Update usage (defensive)
    try {
      await prisma.business.update({
        where: { id: integration.businessId },
        data: { messagesUsed: { increment: 1 } }
      });
    } catch (e) {
      if (e && e.code === 'P2025') {
        logger.warn('Telegram: business not found when updating usage', { businessId: integration.businessId });
      } else {
        logger.error('Telegram: error updating business usage', e);
      }
    }

    res.status(200).send('OK');

  } catch (error) {
    logger.error('Telegram Webhook Error', error);
    // Log to SystemLog
    await prisma.systemLog.create({
      data: {
        level: 'ERROR',
        message: `Telegram Webhook Error: ${error.message}`,
        context: { integrationId: req.params.integrationId, error: error.stack }
      }
    });
    res.status(500).send('Error');
  }
});

module.exports = router;
