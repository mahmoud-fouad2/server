const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const { authenticateToken } = require('../middleware/auth');
const prisma = require('../config/database');
const cacheService = require('../services/cache.service');
const visitorSession = require('../services/visitor-session.service');
const { validateRating, validateChatMessage } = require('../middleware/validation');
const aiService = require('../services/ai.service');
const vectorSearch = require('../services/vector-search.service');
const responseValidator = require('../services/response-validator.service');
const chatController = require('../controllers/chat.controller');
const logger = require('../utils/logger');

// Rate limiter for public chat endpoint
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  message: 'Too many messages from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/message', chatLimiter, validateChatMessage, chatController.sendMessage);
      
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: askDetailsMsg,
          tokensUsed: 0,
          wasFromCache: false
        }
      });

      return res.json({
        response: askDetailsMsg,
        conversationId: conversation.id,
        fromCache: false,
        action: 'ask_details'
      });
    }

    // Check Redis cache first (significant cost savings!)
    const cachedResponse = await cacheService.get(businessId, message);
    if (cachedResponse) {
      console.log('[Chat] ✅ Using cached response');
      
      // Still save messages to DB for history
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: cachedResponse.response.response || cachedResponse.response,
          tokensUsed: 0, // From cache, no tokens used
          wasFromCache: true,
          aiModel: 'cached'
        }
      });

      return res.json({
        response: cachedResponse.response.response || cachedResponse.response,
        conversationId: conversation.id,
        fromCache: true,
        tokensUsed: 0,
        model: 'redis-cache'
      });
    }

    // Get Conversation History (last 20 messages for better context)
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // 🎯 دمج اللهجة المكتشفة في widgetConfig
    let widgetConfig = {};
    try {
      widgetConfig = typeof business.widgetConfig === 'string' 
        ? JSON.parse(business.widgetConfig) 
        : business.widgetConfig || {};
      
      // استخدام اللهجة المكتشفة من جلسة الزائر
      if (detectedDialect && detectedDialect !== 'standard') {
        widgetConfig.dialect = detectedDialect;
        console.log(`[Chat] 🎯 Using detected dialect: ${detectedDialect}`);
      }
    } catch (e) {
      console.warn('Failed to parse widgetConfig:', e);
    }

    // تحديث business.widgetConfig بالتكوين المعدّل
    business.widgetConfig = widgetConfig;

    // ⚡ Use Vector Search (أخذ 3 نتائج فقط لتقليل الرغي)
    let knowledgeContext = [];
    try {
      knowledgeContext = await vectorSearch.searchKnowledge(message, businessId, 3);
      console.log(`[Chat] 📚 Found ${knowledgeContext.length} relevant knowledge chunks`);
    } catch (vectorError) {
      console.warn('[Chat] Vector search failed, falling back to recent knowledge:', vectorError.message);
      // Fallback: Get recent knowledge entries (2 فقط)
      const fallbackKnowledge = await prisma.knowledgeBase.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 2
      });
      knowledgeContext = fallbackKnowledge;
    }

    // Format conversation history for Groq
    const formattedHistory = history.reverse().map(msg => ({
      role: msg.role === 'USER' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Generate AI Response using Hybrid AI Service
    try {
      // Construct System Prompt
      const systemPrompt = `
You are an AI customer support agent for ${business.name}, a ${business.activityType || 'business'}.
Your goal is to assist customers with questions related to ${business.name} only.

Directives:
1. Answer ONLY based on the provided Context.
2. If the answer is not in the Context, politely say you don't know and offer to connect them with a human agent.
3. DO NOT answer general knowledge questions (e.g., politics, history, celebrities, math) unless they are directly related to the business.
4. Maintain a ${business.botTone || 'friendly'} tone.
5. Always reply in the same language as the user's last message.
${widgetConfig.dialect ? `6. Speak in the ${widgetConfig.dialect} dialect.` : ''}

Context:
${knowledgeContext.map(k => k.content).join('\n\n')}
      `.trim();

      const messages = [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: message }
      ];

      const aiResult = await aiService.generateResponse(messages);

      // Sanitize AI response to remove any provider/model self-identification
      const sanitizedResponse = responseValidator.sanitizeResponse(aiResult.response || '');

      // Validate response quality
      const validation = responseValidator.validateResponse(aiResult.response, {
        isFirstMessage: formattedHistory.length === 0,
        expectArabic: business.language === 'ar' || detectedDialect !== 'standard',
        businessType: business.activityType
      });

      if (!validation.isValid) {
        console.warn('[Chat] Response validation failed:', validation.issues);
        // Log validation issues for monitoring
        // In production, you might want to regenerate or flag for review
      }

      // Update business message usage (defensive)
      try {
        await prisma.business.update({
          where: { id: businessId },
          data: { messagesUsed: { increment: 1 } }
        });
      } catch (e) {
        if (e && e.code === 'P2025') {
          logger.warn('Chat route: business not found when updating usage', { businessId });
        } else {
          logger.error('Chat route: error updating business usage', e);
        }
      }

      // Save AI Message (store sanitized response)
      const aiMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: sanitizedResponse,
          tokensUsed: aiResult.tokensUsed || 0,
          wasFromCache: false,
          aiModel: aiResult.model || 'groq-llama'
        }
      });

      // Cache the sanitized response for future queries (7 days TTL)
      const cachePayload = { ...aiResult, response: sanitizedResponse };
      await cacheService.set(businessId, message, cachePayload, 7 * 24 * 60 * 60);

      res.json({
        response: sanitizedResponse,
        conversationId: conversation.id,
        sessionId: visitorSessionData?.id || null, // 🎯 إرجاع sessionId للعميل
        fromCache: false,
        tokensUsed: aiResult.tokensUsed,
        model: aiResult.model,
        dialect: detectedDialect // 🌍 اللهجة المستخدمة
      });

    } catch (aiError) {
      logger.error('Groq AI Error:', aiError);
      
      // Fallback response
      const fallbackResponse = business.widgetConfig?.dialect === 'sa' 
        ? 'والله المعذرة، عندي مشكلة مؤقتة. تحب أحولك لموظف خدمة العملاء؟'
        : 'عذراً، يوجد خطأ مؤقت. هل تريد التحدث مع أحد موظفينا؟';

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: fallbackResponse,
          tokensUsed: 0,
          wasFromCache: false
        }
      });

      res.json({
        response: fallbackResponse,
        conversationId: conversation.id,
        fromCache: false,
        error: 'AI_ERROR'
      });
    }

  } catch (error) {
    logger.error('Chat Error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Test endpoint for widget/examples page
router.post('/test', chatLimiter, async (req, res) => {
  try {
    const { message, businessId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use default business if not provided
    let business;
    if (businessId) {
      business = await prisma.business.findUnique({ where: { id: businessId } });
    } else {
      business = await prisma.business.findFirst();
    }

    if (!business) {
      return res.status(404).json({ error: 'No business found' });
    }

    // Simple AI response for testing
    const aiResponse = await aiService.generateResponse(
      [{ role: 'user', content: message }]
    );

    res.json({
      response: aiResponse?.response || 'مرحباً! كيف يمكنني مساعدتك؟',
      businessId: business.id
    });

  } catch (error) {
    logger.error('Test Chat Error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      response: 'عذراً، حدث خطأ. حاول مرة أخرى.'
    });
  }
});

module.exports = router;
