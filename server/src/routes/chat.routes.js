const express = require('express');
const router = express.Router();
const groqService = require('../services/groq.service');
const vectorSearch = require('../services/vector-search.service');
const redisCache = require('../services/redis-cache.service');
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateChatMessage, validateRating } = require('../middleware/validation');

// Protected: Get all conversations for the business
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    if (!businessId) return res.status(400).json({ error: 'Business ID required' });

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
    console.error('Get Conversations Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Protected: Get messages for a conversation
router.get('/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    console.error('Get Messages Error:', error);
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
    console.error('Get Handover Requests Error:', error);
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
    console.error('Agent Reply Error:', error);
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
    console.error('Rating Error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Public Chat Endpoint (for Widget)
router.post('/message', validateChatMessage, async (req, res) => {
  try {
    const { message, businessId, conversationId } = req.body;

    if (!message || !businessId) {
      return res.status(400).json({ error: 'Message and Business ID are required' });
    }

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    }
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          businessId,
          channel: 'WIDGET',
          status: 'ACTIVE'
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
    const cachedResponse = await redisCache.get(businessId, message);
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

    // Get Conversation History (last 10 messages)
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get Business Info
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Use Vector Search to find relevant knowledge chunks
    let knowledgeContext = [];
    try {
      knowledgeContext = await vectorSearch.searchKnowledge(message, businessId, 5);
      console.log(`[Chat] Found ${knowledgeContext.length} relevant knowledge chunks using vector search`);
    } catch (vectorError) {
      console.warn('[Chat] Vector search failed, falling back to recent knowledge:', vectorError.message);
      // Fallback: Get recent knowledge entries
      const fallbackKnowledge = await prisma.knowledgeBase.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      knowledgeContext = fallbackKnowledge;
    }

    // Parse widget config
    let widgetConfig = {};
    try {
      widgetConfig = typeof business.widgetConfig === 'string' 
        ? JSON.parse(business.widgetConfig) 
        : business.widgetConfig || {};
    } catch (e) {
      console.warn('Failed to parse widgetConfig:', e);
    }

    // Format conversation history for Groq
    const formattedHistory = history.reverse().map(msg => ({
      role: msg.role === 'USER' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Generate AI Response using Groq with vector search results
    try {
      const aiResult = await groqService.generateChatResponse(
        message,
        { ...business, widgetConfig },
        formattedHistory,
        knowledgeContext // Use vector search results instead of all knowledge
      );

      // Update business message usage
      await prisma.business.update({
        where: { id: businessId },
        data: {
          messagesUsed: { increment: 1 }
        }
      });

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
      await redisCache.set(businessId, message, aiResult, 7 * 24 * 60 * 60);

      res.json({
        response: aiResult.response,
        conversationId: conversation.id,
        fromCache: false,
        tokensUsed: aiResult.tokensUsed,
        model: aiResult.model
      });

    } catch (aiError) {
      console.error('Groq AI Error:', aiError);
      
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
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

module.exports = router;
