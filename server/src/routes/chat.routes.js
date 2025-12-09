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
const logger = require('../utils/logger');

// Rate limiter for public chat endpoint
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  message: 'Too many messages from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

// Protected: Get all conversations for the business
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!businessId) {
      // Return empty list instead of 400 to prevent frontend errors
      return res.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { businessId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.conversation.count({ where: { businessId } })
    ]);

    res.json({
      data: conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get Conversations Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Protected: Get messages for a conversation
router.get('/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const cursor = req.query.cursor;

    const queryOptions = {
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    const messages = await prisma.message.findMany(queryOptions);
    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    res.json({
      data: messages,
      pagination: { nextCursor }
    });
  } catch (error) {
    logger.error('Get Messages Error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Protected: Get Handover Requests
router.get('/handover-requests', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    
    const conversations = await prisma.conversation.findMany({
      where: { 
        businessId,
        messages: {
          some: {
            role: 'SYSTEM',
            content: { startsWith: 'HANDOVER_REQUEST' }
          }
        }
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(conversations);
  } catch (error) {
    logger.error('Get Handover Requests Error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Protected: Agent Reply
router.post('/reply', authenticateToken, async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    
    const newMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: message,
        wasFromCache: false,
        tokensUsed: 0
      }
    });
    
    // Update conversation timestamp and status
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        updatedAt: new Date(),
        status: 'AGENT_ACTIVE'
      }
    });

    res.json(newMessage);
  } catch (error) {
    logger.error('Agent Reply Error:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// Public: Submit Rating
router.post('/rating', validateRating, async (req, res) => {
  try {
    const { conversationId, rating, feedback } = req.body;
    
    if (!conversationId || !rating) {
      return res.status(400).json({ error: 'Conversation ID and rating are required' });
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        rating: parseInt(rating),
        feedback: feedback || null,
        status: 'CLOSED'
      }
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Rating Error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Public Chat Endpoint (for Widget) - with rate limiting
router.post('/message', chatLimiter, validateChatMessage, async (req, res) => {
  try {
    let { message, businessId, conversationId, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Sanitize user message to prevent XSS attacks
    message = sanitizeHtml(message, {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {}
    });

    // Validate business exists (temporarily disabled for testing)
    // const business = await prisma.business.findUnique({ where: { id: businessId } });
    // if (!business) {
    //   return res.status(404).json({ error: 'Business not found' });
    // }

    // Prefer an explicit businessId passed by the client. If provided but not found, return 404.
    let business = null;
    if (businessId) {
      business = await prisma.business.findUnique({ where: { id: businessId } });
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }
    } else {
      // No businessId provided — fall back to a safe default business (for demo sites only)
      business = await prisma.business.findFirst();
      if (!business) {
        // Find existing user or create one
        let defaultUser = await prisma.user.findFirst();
        if (!defaultUser) {
          defaultUser = await prisma.user.create({
            data: {
              email: 'default@faheemly.com',
              password: await require('bcryptjs').hash('default123', 10),
              name: 'Default User',
              role: 'CLIENT'
            }
          });
        }
        
        // Create a default business
        business = await prisma.business.create({
          data: {
            userId: defaultUser.id,
            name: 'Default Business',
            activityType: 'COMPANY',
            botTone: 'friendly',
            status: 'ACTIVE',
            planType: 'ENTERPRISE',
            messageQuota: 999999,
            messagesUsed: 0
          }
        });
      }
    }

    // Ensure we use a valid business id for all downstream operations
    const resolvedBusinessId = business.id;

    // 🎯 إنشاء أو استرجاع جلسة الزائر (مع كشف اللهجة)
    let visitorSessionData = null;
    let detectedDialect = 'standard';
    
    try {
      visitorSessionData = await visitorSession.getOrCreateSession(resolvedBusinessId, sessionId, req);
      detectedDialect = visitorSessionData.detectedDialect || 'standard';
      console.log(`[Chat] 🌍 Visitor from ${visitorSessionData.country} | Dialect: ${detectedDialect}`);
    } catch (visitorError) {
      console.warn('[Chat] Visitor session error:', visitorError.message || visitorError);
    }

    // Find or create conversation (ربط بالجلسة)
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    }
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          businessId: resolvedBusinessId,
          channel: 'WIDGET',
          status: 'ACTIVE',
          visitorSessionId: visitorSessionData?.id || null
        }
      });
    }

    // Save User Message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message
      }
    });

    // If conversation is already in handover mode, do not trigger AI
    if (conversation.status === 'HANDOVER_REQUESTED' || conversation.status === 'AGENT_ACTIVE') {
       return res.json({
         status: 'waiting_for_agent',
         conversationId: conversation.id
       });
    }

    // Check for Live Agent Handover
    const lowerMsg = message.toLowerCase();
    const handoverKeywords = ['agent', 'human', 'support', 'مساعدة', 'موظف', 'خدمة عملاء', 'بشري', 'i need agent'];
    
    // Check if we are in "Waiting for details" state
    const lastAssistantMessage = await prisma.message.findFirst({
      where: { conversationId: conversation.id, role: 'ASSISTANT' },
      orderBy: { createdAt: 'desc' }
    });

    const isWaitingForDetails = lastAssistantMessage && lastAssistantMessage.content.includes('الاسم وملخص المشكلة');

    if (isWaitingForDetails) {
       const handoverMsg = "شكراً لك. تم استلام طلبك وسيتم تحويلك لأحد موظفينا حالاً.";
       
       // Create SYSTEM message to flag this
       await prisma.message.create({
         data: {
           conversationId: conversation.id,
           role: 'SYSTEM',
           content: `HANDOVER_REQUEST|${message}` // Store user details here
         }
       });

       // Update status
       await prisma.conversation.update({
         where: { id: conversation.id },
         data: { status: 'HANDOVER_REQUESTED' }
       });

       // Send confirmation to user
       await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: handoverMsg,
          tokensUsed: 0,
          wasFromCache: false
        }
       });

       // TODO: Send Email Notification here (Mocked)
       console.log(`[Email Sent] Handover request from ${message} for business ${businessId}`);

       return res.json({
         response: handoverMsg,
         conversationId: conversation.id,
         fromCache: false,
         action: 'handover_complete'
       });
    }

    const isHandover = handoverKeywords.some(kw => lowerMsg.includes(kw));

    if (isHandover) {
      const askDetailsMsg = "لتحويلك للموظف المختص، يرجى تزويدي بـ: الاسم وملخص المشكلة.";
      
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

      // Save AI Message
      const aiMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: aiResult.response,
          tokensUsed: aiResult.tokensUsed || 0,
          wasFromCache: false,
          aiModel: aiResult.model || 'groq-llama'
        }
      });

      // Cache the response for future queries (7 days TTL)
      await cacheService.set(businessId, message, aiResult, 7 * 24 * 60 * 60);

      res.json({
        response: aiResult.response,
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
