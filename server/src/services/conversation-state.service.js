/**
 * Conversation State Management Service
 * Tracks conversation stage, context, and user goals
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');

class ConversationStateService {
  /**
   * Get or create conversation state
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Conversation state object
   */
  async getState(conversationId) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20 // Last 20 messages for context
          }
        }
      });

      if (!conversation) {
        return this.createInitialState();
      }

      // Determine stage based on conversation
      const stage = this.determineStage(conversation);
      const messageCount = conversation.messages.length;
      const isFirstMessage = messageCount <= 1;

      return {
        conversationId,
        stage,
        messageCount,
        isFirstMessage,
        context: this.extractContext(conversation),
        goals: this.extractGoals(conversation.messages),
        lastIntent: null // Will be set by intent detection
      };
    } catch (error) {
      logger.error('Failed to get conversation state', error);
      return this.createInitialState();
    }
  }

  /**
   * Create initial state
   */
  createInitialState() {
    return {
      stage: 'INITIAL',
      messageCount: 0,
      isFirstMessage: true,
      context: {},
      goals: [],
      lastIntent: null
    };
  }

  /**
   * Determine conversation stage
   * @param {Object} conversation - Conversation object with messages
   * @returns {string} - Stage: INITIAL, GREETING, ACTIVE, CLOSING, CLOSED
   */
  determineStage(conversation) {
    if (conversation.status === 'CLOSED') {
      return 'CLOSED';
    }

    const messageCount = conversation.messages.length;
    
    if (messageCount === 0) {
      return 'INITIAL';
    }

    if (messageCount === 1) {
      return 'GREETING';
    }

    // Check if last message indicates closing
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage && lastMessage.role === 'USER') {
      const content = lastMessage.content.toLowerCase();
      if (content.includes('شكراً') || content.includes('thanks') || content.includes('bye') || content.includes('وداعاً')) {
        return 'CLOSING';
      }
    }

    return 'ACTIVE';
  }

  /**
   * Extract context from conversation
   * @param {Object} conversation - Conversation object
   * @returns {Object} - Context object
   */
  extractContext(conversation) {
    const context = {
      businessId: conversation.businessId,
      channel: conversation.channel,
      hasPreChatData: !!conversation.preChatData,
      visitorSessionId: conversation.visitorSessionId
    };

    // Parse pre-chat data if available
    if (conversation.preChatData) {
      try {
        const preChatData = JSON.parse(conversation.preChatData);
        context.userName = preChatData.name;
        context.userEmail = preChatData.email;
        context.userPhone = preChatData.phone;
        context.initialRequest = preChatData.requestSummary;
      } catch (e) {
        logger.warn('Failed to parse pre-chat data', { conversationId: conversation.id });
      }
    }

    return context;
  }

  /**
   * Extract user goals from messages
   * @param {Array} messages - Array of messages
   * @returns {Array} - Array of goals
   */
  extractGoals(messages) {
    const goals = [];
    const userMessages = messages.filter(m => m.role === 'USER');

    // Simple goal extraction based on keywords
    for (const msg of userMessages) {
      const content = msg.content.toLowerCase();
      
      if (content.includes('سعر') || content.includes('price') || content.includes('تكلفة')) {
        goals.push('PRICING_INQUIRY');
      }
      
      if (content.includes('طلب') || content.includes('order') || content.includes('شراء')) {
        goals.push('PLACE_ORDER');
      }
      
      if (content.includes('مشكلة') || content.includes('problem') || content.includes('issue')) {
        goals.push('SUPPORT_REQUEST');
      }
      
      if (content.includes('حجز') || content.includes('reservation') || content.includes('appointment')) {
        goals.push('BOOKING_REQUEST');
      }
    }

    return [...new Set(goals)]; // Remove duplicates
  }

  /**
   * Update state based on new message and intent
   * @param {Object} currentState - Current state
   * @param {Object} intent - Intent detection result
   * @returns {Object} - Updated state
   */
  updateState(currentState, intent) {
    const newState = { ...currentState };
    newState.lastIntent = intent.intent;

    // Update stage based on intent
    if (intent.intent === 'GREETING' && currentState.stage === 'INITIAL') {
      newState.stage = 'GREETING';
    } else if (intent.intent === 'QUESTION' && currentState.stage === 'GREETING') {
      newState.stage = 'ACTIVE';
    } else if (intent.intent === 'CLOSING') {
      newState.stage = 'CLOSING';
    } else if (intent.intent === 'QUESTION' && currentState.stage === 'ACTIVE') {
      // Stay in ACTIVE, but track that we're in a question-answer flow
      newState.stage = 'ACTIVE';
    }

    // Update message count
    newState.messageCount = (currentState.messageCount || 0) + 1;
    newState.isFirstMessage = newState.messageCount <= 1;

    return newState;
  }
}

module.exports = new ConversationStateService();

