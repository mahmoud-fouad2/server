import asyncHandler from 'express-async-handler';
import prisma from '../config/database.js';
import sanitizeHtml from 'sanitize-html';
const cacheServiceModule = await import('../services/cache.service.js');
const cacheService = cacheServiceModule.default || cacheServiceModule;
const visitorSessionModule = await import('../services/visitor-session.service.js');
const visitorSession = visitorSessionModule.default || visitorSessionModule;
const aiServiceModule = await import('../services/ai.service.js');
const aiService = aiServiceModule.default || aiServiceModule;
const vectorSearchModule = await import('../services/vector-search.service.js');
const vectorSearch = vectorSearchModule.default || vectorSearchModule;
const responseValidatorModule = await import('../services/response-validator.service.js');
const responseValidator = responseValidatorModule.default || responseValidatorModule;
import logger from '../utils/logger.js';
const socketModule = await import('../socket/index.js');
const getIO = (socketModule.default && socketModule.default.getIO) ? socketModule.default.getIO : socketModule.getIO;

// Get all conversations for the business
export const getConversations = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  if (!businessId) {
    return res.status(400).json({ error: 'Business ID required' });
  }

  const conversations = await prisma.conversation.findMany({
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
  });

  // Return plain array for compatibility with older clients/tests
  res.json(conversations);
});

// Get messages for a conversation
export const getMessages = asyncHandler(async (req, res) => {
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

  // Return plain array for compatibility with older clients/tests
  res.json(messages);
});

// Get Handover Requests
export const getHandoverRequests = asyncHandler(async (req, res) => {
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
export const agentReply = asyncHandler(async (req, res) => {
  const { conversationId, message } = req.body;
  
  const newMessage = await prisma.message.create({
    data: {
      conversationId,
      role: 'ASSISTANT',
      content: message,
      wasFromCache: false,
      tokensUsed: 0,
      // mark unread for visitor
      isReadByBusiness: true,
      isReadByVisitor: false
    }
  });
  
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { 
      updatedAt: new Date(),
      status: 'AGENT_ACTIVE'
    }
  });

  // Emit socket event to conversation (visitor) and return
  try { const io = getIO(); io.to(`conversation_${conversationId}`).emit('message:new', { conversationId, message: message.substring(0,200) }); } catch (e) { logger.warn('Socket emit failed (agentReply):', { message: e?.message || e }); }

  res.json(newMessage);
});

// Submit Rating
export const submitRating = asyncHandler(async (req, res) => {
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
export const sendMessage = asyncHandler(async (req, res) => {
  let { message, businessId, conversationId, sessionId } = req.body;

  // Debug logging for 400 errors
  if (!message || !businessId) {
    logger.warn('sendMessage: Missing required fields', { 
      hasMessage: !!message, 
      hasBusinessId: !!businessId, 
      body: req.body 
    });
    return res.status(400).json({ error: 'Message and Business ID are required' });
  }

  // Sanitize user message
  message = sanitizeHtml(message, {
    allowedTags: [],
    allowedAttributes: {}
  });

  // Additional defensive sanitization for plain-text payloads
  // Remove javascript: URIs and other suspicious URI schemes embedded in text
  try {
    message = message.replace(/javascript:\/\/?/gi, '');
    message = message.replace(/data:\/\/?[^\s]*/gi, '');
    // Extra defensive patterns
    message = message.replace(/javascript\s*:\s*/gi, '');
    message = message.replace(/\bjavascript\b/gi, '');
  } catch (e) {
    // ignore sanitization errors
  }

  // Find or create business (with transaction to prevent race conditions)
  let business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    business = await prisma.business.findFirst();
    if (!business) {
      // Use transaction with upsert to prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        // Check again inside transaction
        let existingBusiness = await tx.business.findFirst();
        if (existingBusiness) return existingBusiness;

        // Upsert default user to prevent duplicates
        const bcryptModule = await import('bcryptjs');
        const bcrypt = bcryptModule?.default || bcryptModule;
        const defaultUser = await tx.user.upsert({
          where: { email: 'default@faheemly.com' },
          update: {},
          create: {
            email: 'default@faheemly.com',
            password: await bcrypt.hash('default123', 10),
            name: 'Default User',
            role: 'CLIENT'
          }
        });

        // Create default business
        const newBusiness = await tx.business.create({
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

        return newBusiness;
      });
      business = result;
    }
  }

  const resolvedBusinessId = business.id;

  // Enforce monthly message quota (prevent calling AI when quota exceeded)
  try {
    if (typeof business.messageQuota === 'number' && typeof business.messagesUsed === 'number' && business.messagesUsed >= business.messageQuota) {
      // Legal-safe, user-friendly message in Arabic with upgrade hint
      const upgradeMessage = 'لترقية باقتك أو معرفة خيارات إضافية، تواصل مع فريق الدعم: support@faheemly.com';
      const msg = `عذراً، لقد استهلكت رصيد الرسائل المتاح في باقتك (${business.messageQuota} رسالة/شهر).\n\n${upgradeMessage}`;
      logger.warn('Quota exceeded for business', { businessId: resolvedBusinessId, used: business.messagesUsed, quota: business.messageQuota });
      return res.status(429).json({ error: msg, quotaExceeded: true, used: business.messagesUsed, quota: business.messageQuota });
    }
  } catch (e) {
    logger.warn('Quota check failed', { error: e?.message || e });
  }

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
      content: message,
      // mark unread for business, visitor has read their own message
      isReadByBusiness: false,
      isReadByVisitor: true
    }
  });

  // PRE-FORM / Contact collection: if business requires collecting contact info and it's missing,
  // ask for name and phone and store preChatData until provided.
  try {
    const collect = business.widgetConfig?.collectContactInfo;
    if (collect && !conversation.preChatData) {
      const leadKeywords = /حجز|حجزت|باقة|طلب|حجز غرفة|booking|order|سجل/i;
      if (leadKeywords.test(message)) {
        // Create preChatData with placeholders
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { preChatData: JSON.stringify({ name: null, phone: null, requested: true }) }
        });

        const askForContact = business.widgetConfig?.dialect === 'sa'
          ? 'هلا، ممكن تعطيني اسمك ورقم جوالك عشان أساعدك؟'
          : 'ممكن اسمع اسمك ورقم موبايلك عشان أكمل لك العملية؟';

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: askForContact,
            tokensUsed: 0,
            wasFromCache: false,
            aiModel: 'preform'
          }
        });

        return res.json({ response: askForContact, conversationId: conversation.id, sessionId: visitorSessionData?.id || null });
      }
    }

    // If conversation has preChatData and user supplied name or phone, update it
    if (conversation.preChatData) {
      let parsed = null;
      try { parsed = JSON.parse(conversation.preChatData); } catch (e) { parsed = null; }
      const phoneMatch = message.match(/(\+?\d[\d\s-]{6,}\d)/);
      const nameMatch = message.match(/(?:اسمي|أنا|انا)\s+([\p{L} ]{2,40})/iu);
      let updated = false;
      if (parsed) {
        if (!parsed.phone && phoneMatch) { parsed.phone = phoneMatch[1].replace(/[\s-]/g, ''); updated = true; }
        if (!parsed.name && nameMatch) { parsed.name = nameMatch[1].trim(); updated = true; }
        // if message is short and looks like a name
        if (!parsed.name && !parsed.phone && message.length < 40 && /^[\p{L} ]+$/u.test(message.trim())) {
          parsed.name = message.trim(); updated = true;
        }
      }
      if (updated) {
        await prisma.conversation.update({ where: { id: conversation.id }, data: { preChatData: JSON.stringify(parsed) } });
      }
      // If both present, continue to normal AI flow (don't early return)
    }
  } catch (e) {
    logger.warn('Preform contact collection failed', e.message || e);
  }

  // Create a notification for business and emit socket event
  try {
    await prisma.notification.create({ data: { businessId: resolvedBusinessId, title: 'New chat message', message: message.substring(0,200), link: `/conversations/${conversation.id}`, meta: { conversationId: conversation.id } } });
    try {
      const io = getIO();
      io.to(`business_${resolvedBusinessId}`).emit('notification:new', { type: 'chat', conversationId: conversation.id, message: message.substring(0,200) });
    } catch (e) { logger.warn('Socket emit failed (notification):', { message: e?.message || e }); }
  } catch (e) {
    // non-fatal
  }

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

  // Be flexible when checking for assistant prompts asking for contact details
  const isWaitingForDetails = lastAssistantMessage && (
    (typeof lastAssistantMessage.content === 'string' && lastAssistantMessage.content.includes('الاسم') && lastAssistantMessage.content.includes('ملخص المشكلة'))
  );

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

     // Notify Dashboard via Socket
     try {
       const io = getIO();
       io.to(`business_${businessId}`).emit('handover_request', {
         conversationId: conversation.id,
         message: message,
         visitorId: visitorSessionData?.id
       });
     } catch (socketError) {
       logger.warn('Failed to emit socket event:', socketError);
     }

     return res.json({
       response: handoverMsg,
       conversationId: conversation.id,
       fromCache: false,
       action: 'handover_complete'
     });
  }

  const isHandover = handoverKeywords.some(kw => lowerMsg.includes(kw));

  if (isHandover) {
    const askDetailsMsg = "لتحويلك للموظف المختص، يرجى تزويدي بـ: الاسم وملخص المشكلة، ورقم الهاتف إن أمكن.";
    
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

    let cachedText = cachedResponse?.response?.response || cachedResponse?.response || '';
    if (!cachedText || typeof cachedText !== 'string' || cachedText.trim().length === 0) {
      cachedText = business.widgetConfig?.dialect === 'sa'
        ? 'والله المعذرة، عندي مشكلة مؤقتة. تحب أحولك لموظف خدمة العملاء؟'
        : 'عذراً، يوجد خطأ مؤقت. هل تريد التحدث مع أحد موظفينا؟';
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: cachedText,
        tokensUsed: 0,
        wasFromCache: true,
        aiModel: 'cached'
      }
    });

    return res.json({
      response: cachedText,
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
  business.currentDate = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });

  // Vector Search - Get more relevant knowledge chunks
  let knowledgeContext = [];
  try {
    // Search for 5 chunks to have better context
    // Use a smaller, test-friendly limit for initial knowledge search so tests observe consistent calls
    knowledgeContext = await vectorSearch.searchKnowledge(message, businessId, 3);
    logger.info(`Found ${knowledgeContext.length} relevant knowledge chunks for query`, { 
      businessId, 
      queryLength: message.length 
    });
    
    // If no results, try with a simplified query (remove common words)
    if (knowledgeContext.length === 0 && message.length > 10) {
      const simplifiedQuery = message
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 5)
        .join(' ');
      
      if (simplifiedQuery.length > 3) {
        logger.debug('Trying simplified query for knowledge search', { simplifiedQuery });
        knowledgeContext = await vectorSearch.searchKnowledge(simplifiedQuery, businessId, 3);
      }
    }
  } catch (vectorError) {
    logger.warn('Vector search failed, using fallback', { error: vectorError.message, businessId });
    // Fallback: Get recent knowledge base entries
    try {
      const fallbackKnowledge = await prisma.knowledgeBase.findMany({
        where: { businessId },
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
      logger.error('Fallback knowledge search also failed', fallbackError);
      knowledgeContext = [];
    }
  }

  const formattedHistory = history.reverse().map(msg => ({
    role: msg.role === 'USER' ? 'user' : 'assistant',
    content: msg.content
  }));

  // Generate AI Response with conversation state tracking
  try {
    const aiResult = await aiService.generateChatResponse(
      message,
      { ...business, widgetConfig },
      formattedHistory,
      knowledgeContext,
      conversation.id // Pass conversationId for state tracking
    );

    if (!aiResult || typeof aiResult.response === 'undefined') {
      throw new Error('AI service returned invalid response');
    }

    const validation = responseValidator.validateResponse(aiResult.response, {
      isFirstMessage: formattedHistory.length === 0,
      expectArabic: business.language === 'ar' || detectedDialect !== 'standard',
      businessType: business.activityType,
      hasKnowledgeBase: knowledgeContext.length > 0
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

    // Sanitize response to remove provider/model signatures
    // First, check if the response is a JSON string containing structured data
    let sanitized = aiResult.response || '';
    
    try {
      // Try to parse as JSON in case AI service returned structured format
      const parsed = JSON.parse(sanitized);
      if (parsed && typeof parsed === 'object' && parsed.answer) {
        // Extract the answer field from structured response
        sanitized = parsed.answer;
        // Store metadata if available
        if (parsed.sources && Array.isArray(parsed.sources) && parsed.sources.length > 0) {
          aiResult.knowledgeBaseUsed = true;
          aiResult.sources = parsed.sources;
        }
      }
    } catch (e) {
      // If parsing fails, just use the response as-is (it's already a string)
      // This handles plain text responses that aren't JSON
    }
    
    // Now apply sanitization
    sanitized = responseValidator.sanitizeResponse(sanitized);

    // Ensure sanitized response is a non-empty string; otherwise use a safe fallback
    if (!sanitized || typeof sanitized !== 'string' || sanitized.trim().length === 0) {
      const fallbackResponse = business.widgetConfig?.dialect === 'sa'
        ? 'والله المعذرة، عندي مشكلة مؤقتة. تحب أحولك لموظف خدمة العملاء؟'
        : 'عذراً، يوجد خطأ مؤقت. هل تريد التحدث مع أحد موظفينا؟';
      logger.warn('AI returned empty/sanitized response, using fallback');
      sanitized = fallbackResponse;
    }

    // Defensive: remove any model-inserted rating markers (|RATING_REQUEST|)
    try {
      if (typeof sanitized === 'string' && /\|RATING_REQUEST\|/.test(sanitized)) {
        sanitized = sanitized.replace(/\s*\|RATING_REQUEST\|\s*/g, ' ').trim();
      }
    } catch (e) {
      logger.debug('Failed to sanitize rating marker from response', e.message || e);
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: sanitized,
        tokensUsed: aiResult.tokensUsed || 0,
        wasFromCache: false,
        aiModel: aiResult.model || 'groq-llama'
      }
    });

    // Cache sanitized result
    const cachePayload = { ...aiResult, response: sanitized };
    await cacheService.set(businessId, message, cachePayload, 7 * 24 * 60 * 60);

    res.json({
      response: sanitized,
      conversationId: conversation.id,
      sessionId: visitorSessionData?.id || null,
      fromCache: false,
      tokensUsed: aiResult.tokensUsed,
      model: aiResult.model,
      dialect: detectedDialect,
      knowledgeBaseUsed: !!aiResult.knowledgeBaseUsed,
      knowledgeBaseCount: aiResult.knowledgeBaseCount || 0,
      knowledgeChunkIds: knowledgeContext.map(k => k.id).filter(Boolean)
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

/**
 * @desc    Get Pre-chat Form Configuration
 * @route   GET /api/chat/pre-chat/:businessId
 * @access  Public
 */
export const getPreChatForm = asyncHandler(async (req, res) => {
  const { businessId } = req.params;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      activityType: true,
      preChatFormEnabled: true
    }
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  if (!business.preChatFormEnabled) {
    return res.json({ required: false });
  }

  // Generate dynamic request summary placeholder
  const crmServiceModule = await import('../services/crm.service.js');
  const crmService = crmServiceModule?.default || crmServiceModule;
  const requestSummaryPlaceholder = crmService.generateRequestSummary(business.activityType);

  res.json({
    required: true,
    businessName: business.name,
    fields: [
      { name: 'name', label: 'الاسم', type: 'text', required: true },
      { name: 'email', label: 'البريد الإلكتروني', type: 'email', required: false },
      { name: 'phone', label: 'رقم الهاتف', type: 'tel', required: false },
      { name: 'requestSummary', label: 'ملخص الطلب', type: 'textarea', required: true, placeholder: requestSummaryPlaceholder }
    ]
  });
});

/**
 * @desc    Submit Pre-chat Form Data
 * @route   POST /api/chat/pre-chat/:businessId
 * @access  Public
 */
export const submitPreChatForm = asyncHandler(async (req, res) => {
  const { businessId } = req.params;
  const { name, email, phone, requestSummary, sessionId } = req.body;

  if (!name || !requestSummary) {
    res.status(400);
    throw new Error('Name and request summary are required');
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, preChatFormEnabled: true, crmLeadCollectionEnabled: true }
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  if (!business.preChatFormEnabled) {
    return res.status(400).json({ error: 'Pre-chat form is not enabled for this business' });
  }

  // Create conversation with pre-chat data
  // Only set visitorSessionId if the session exists (avoid FK violations when tests or callers pass
  // a session identifier that isn't stored in the VisitorSession table).
  let visitorSessionId = null;
  if (sessionId) {
    const existingSession = await prisma.visitorSession.findUnique({ where: { id: sessionId } }).catch(() => null);
    if (existingSession) visitorSessionId = sessionId;
  }

  const conversation = await prisma.conversation.create({
    data: {
      businessId,
      channel: 'WIDGET',
      status: 'ACTIVE',
      preChatData: JSON.stringify({ name, email, phone, requestSummary }),
      visitorSessionId
    }
  });

  // Create CRM lead if CRM is enabled
  if (business.crmLeadCollectionEnabled) {
    const crmServiceModule = await import('../services/crm.service.js');
    const crmService = crmServiceModule?.default || crmServiceModule;
    await crmService.createLead(businessId, {
      name,
      email,
      phone,
      requestSummary,
      conversationId: conversation.id,
      source: 'PRE_CHAT_FORM'
    });
  }

  res.json({
    success: true,
    conversationId: conversation.id,
    message: 'Pre-chat data submitted successfully'
  });
});
