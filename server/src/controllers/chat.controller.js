const asyncHandler = require('express-async-handler');
const prisma = require('../config/database');
const sanitizeHtml = require('sanitize-html');
const cacheService = require('../services/cache.service');
const visitorSession = require('../services/visitor-session.service');
const aiService = require('../services/ai.service');
const vectorSearch = require('../services/vector-search.service');
const responseValidator = require('../services/response-validator.service');
const logger = require('../utils/logger');

// Get all conversations for the business
exports.getConversations = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  if (!businessId) {
    return res.status(400).json({ error: 'Business ID required' });
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
});

// Get messages for a conversation
exports.getMessages = asyncHandler(async (req, res) => {
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
});

// Get Handover Requests
exports.getHandoverRequests = asyncHandler(async (req, res) => {
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
});

// Agent Reply
exports.agentReply = asyncHandler(async (req, res) => {
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
  
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { 
      updatedAt: new Date(),
      status: 'AGENT_ACTIVE'
    }
  });

  res.json(newMessage);
});

// Submit Rating
exports.submitRating = asyncHandler(async (req, res) => {
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
});

// Public Chat Message Handler
exports.sendMessage = asyncHandler(async (req, res) => {
  let { message, businessId, conversationId, sessionId } = req.body;

  if (!message || !businessId) {
    return res.status(400).json({ error: 'Message and Business ID are required' });
  }

  // Sanitize user message
  message = sanitizeHtml(message, {
    allowedTags: [],
    allowedAttributes: {}
  });

  // Find or create business
  let business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    business = await prisma.business.findFirst();
    if (!business) {
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

  const resolvedBusinessId = business.id;

  // Create or get visitor session
  let visitorSessionData = null;
  let detectedDialect = 'standard';
  
  try {
    visitorSessionData = await visitorSession.getOrCreateSession(resolvedBusinessId, sessionId, req);
    detectedDialect = visitorSessionData.detectedDialect || 'standard';
    logger.info(`Visitor from ${visitorSessionData.country} | Dialect: ${detectedDialect}`);
  } catch (visitorError) {
    logger.warn('Visitor session error:', visitorError);
  }

  // Find or create conversation
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

  // Check if conversation is in handover mode
  if (conversation.status === 'HANDOVER_REQUESTED' || conversation.status === 'AGENT_ACTIVE') {
     return res.json({
       status: 'waiting_for_agent',
       conversationId: conversation.id
     });
  }

  // Check for handover keywords
  const lowerMsg = message.toLowerCase();
  const handoverKeywords = ['agent', 'human', 'support', 'مساعدة', 'موظف', 'خدمة عملاء', 'بشري', 'i need agent'];
  
  const lastAssistantMessage = await prisma.message.findFirst({
    where: { conversationId: conversation.id, role: 'ASSISTANT' },
    orderBy: { createdAt: 'desc' }
  });

  const isWaitingForDetails = lastAssistantMessage && lastAssistantMessage.content.includes('الاسم وملخص المشكلة');

  if (isWaitingForDetails) {
     const handoverMsg = "شكراً لك. تم استلام طلبك وسيتم تحويلك لأحد موظفينا حالاً.";
     
     await prisma.message.create({
       data: {
         conversationId: conversation.id,
         role: 'SYSTEM',
         content: `HANDOVER_REQUEST|${message}`
       }
     });

     await prisma.conversation.update({
       where: { id: conversation.id },
       data: { status: 'HANDOVER_REQUESTED' }
     });

     await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: handoverMsg,
        tokensUsed: 0,
        wasFromCache: false
      }
     });

     logger.info(`Handover request from ${message} for business ${businessId}`);

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

  // Check Redis cache
  const cachedResponse = await cacheService.get(businessId, message);
  if (cachedResponse) {
    logger.info('Using cached response');
    
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: cachedResponse.response.response || cachedResponse.response,
        tokensUsed: 0,
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

  // Get conversation history
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  // Merge dialect into widgetConfig
  let widgetConfig = {};
  try {
    widgetConfig = typeof business.widgetConfig === 'string' 
      ? JSON.parse(business.widgetConfig) 
      : business.widgetConfig || {};
    
    if (detectedDialect && detectedDialect !== 'standard') {
      widgetConfig.dialect = detectedDialect;
      logger.info(`Using detected dialect: ${detectedDialect}`);
    }
  } catch (e) {
    logger.warn('Failed to parse widgetConfig:', e);
  }

  business.widgetConfig = widgetConfig;

  // Vector Search
  let knowledgeContext = [];
  try {
    knowledgeContext = await vectorSearch.searchKnowledge(message, businessId, 3);
    logger.info(`Found ${knowledgeContext.length} relevant knowledge chunks`);
  } catch (vectorError) {
    logger.warn('Vector search failed:', vectorError);
    const fallbackKnowledge = await prisma.knowledgeBase.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 2
    });
    knowledgeContext = fallbackKnowledge;
  }

  const formattedHistory = history.reverse().map(msg => ({
    role: msg.role === 'USER' ? 'user' : 'assistant',
    content: msg.content
  }));

  // Generate AI Response
  try {
    const aiResult = await aiService.generateChatResponse(
      message,
      { ...business, widgetConfig },
      formattedHistory,
      knowledgeContext
    );

    const validation = responseValidator.validateResponse(aiResult.response, {
      isFirstMessage: formattedHistory.length === 0,
      expectArabic: business.language === 'ar' || detectedDialect !== 'standard',
      businessType: business.activityType
    });

    if (!validation.isValid) {
      logger.warn('Response validation failed:', validation.issues);
    }

    try {
      await prisma.business.update({
        where: { id: businessId },
        data: { messagesUsed: { increment: 1 } }
      });
    } catch (e) {
      logger.warn('Failed to update business usage:', e);
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: aiResult.response,
        tokensUsed: aiResult.tokensUsed || 0,
        wasFromCache: false,
        aiModel: aiResult.model || 'groq-llama'
      }
    });

    await cacheService.set(businessId, message, aiResult, 7 * 24 * 60 * 60);

    res.json({
      response: aiResult.response,
      conversationId: conversation.id,
      sessionId: visitorSessionData?.id || null,
      fromCache: false,
      tokensUsed: aiResult.tokensUsed,
      model: aiResult.model,
      dialect: detectedDialect
    });

  } catch (aiError) {
    logger.error('AI Error:', aiError);
    
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
});
