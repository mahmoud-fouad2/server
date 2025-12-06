const EventEmitter = require('events');

/**
 * Agent Handoff Service
 * Handles automatic transfer to human agents with quality assurance
 */
class AgentHandoffService extends EventEmitter {
  constructor() {
    super();
    this.handoffQueue = new Map();
    this.activeHandoffs = new Map();
    this.agentPool = new Map();
    this.handoffRules = this.initializeHandoffRules();

    // Quality assurance metrics
    this.qualityMetrics = {
      handoffSuccess: 0,
      handoffFailures: 0,
      averageResolutionTime: 0,
      customerSatisfaction: 0
    };
  }

  /**
   * Initialize handoff rules
   * @returns {Object} Handoff rules configuration
   */
  initializeHandoffRules() {
    return {
      sentiment: {
        negative: { threshold: -0.3, priority: 'high' },
        urgent: { keywords: ['عاجل', 'طارئ', 'مساعدة فورية', 'مشكلة كبيرة'], priority: 'high' }
      },
      complexity: {
        high: {
          keywords: ['معقد', 'صعب', 'غير واضح', 'أحتاج شرح', 'لا أفهم'],
          maxBotAttempts: 3,
          priority: 'medium'
        }
      },
      topics: {
        escalation: {
          keywords: ['أريد متحدث', 'أريد إنسان', 'عامل حقيقي', 'لا أثق بالبوت'],
          priority: 'high'
        },
        complaints: {
          keywords: ['شكوى', 'غير راضي', 'سيء', 'مستاء', 'غاضب'],
          priority: 'high'
        }
      },
      fallback: {
        maxBotMessages: 10,
        timeLimit: 30 * 60 * 1000, // 30 minutes
        priority: 'low'
      }
    };
  }

  /**
   * Evaluate if conversation needs handoff
   * @param {Object} conversation - Conversation data
   * @param {Object} sentiment - Current sentiment analysis
   * @returns {Object} Handoff evaluation result
   */
  evaluateHandoff(conversation, sentiment) {
    const evaluation = {
      shouldHandoff: false,
      reason: null,
      priority: 'low',
      confidence: 0
    };

    // Check sentiment-based handoff
    if (this.checkSentimentHandoff(sentiment, evaluation)) {
      return evaluation;
    }

    // Check complexity-based handoff
    if (this.checkComplexityHandoff(conversation, evaluation)) {
      return evaluation;
    }

    // Check topic-based handoff
    if (this.checkTopicHandoff(conversation, evaluation)) {
      return evaluation;
    }

    // Check fallback handoff
    if (this.checkFallbackHandoff(conversation, evaluation)) {
      return evaluation;
    }

    return evaluation;
  }

  /**
   * Check if sentiment requires handoff
   * @param {Object} sentiment - Sentiment analysis
   * @param {Object} evaluation - Evaluation result
   * @returns {boolean} True if handoff needed
   */
  checkSentimentHandoff(sentiment, evaluation) {
    const rules = this.handoffRules.sentiment;

    // Negative sentiment threshold
    if (sentiment.score < rules.negative.threshold) {
      evaluation.shouldHandoff = true;
      evaluation.reason = 'negative_sentiment';
      evaluation.priority = rules.negative.priority;
      evaluation.confidence = Math.abs(sentiment.score);
      return true;
    }

    // Urgent keywords
    if (sentiment.emotions?.urgent > 0) {
      evaluation.shouldHandoff = true;
      evaluation.reason = 'urgent_keywords';
      evaluation.priority = rules.urgent.priority;
      evaluation.confidence = 0.8;
      return true;
    }

    return false;
  }

  /**
   * Check if conversation complexity requires handoff
   * @param {Object} conversation - Conversation data
   * @param {Object} evaluation - Evaluation result
   * @returns {boolean} True if handoff needed
   */
  checkComplexityHandoff(conversation, evaluation) {
    const rules = this.handoffRules.complexity.high;
    const messages = conversation.messages || [];
    const botMessages = messages.filter(msg => msg.sender === 'bot' || msg.role === 'assistant');

    // Check for complexity keywords in recent messages
    const recentMessages = messages.slice(-5); // Last 5 messages
    const hasComplexityKeywords = recentMessages.some(msg => {
      const content = msg.content || msg.text || '';
      return rules.keywords.some(keyword => content.includes(keyword));
    });

    if (hasComplexityKeywords && botMessages.length >= rules.maxBotAttempts) {
      evaluation.shouldHandoff = true;
      evaluation.reason = 'high_complexity';
      evaluation.priority = rules.priority;
      evaluation.confidence = 0.7;
      return true;
    }

    return false;
  }

  /**
   * Check if topic requires handoff
   * @param {Object} conversation - Conversation data
   * @param {Object} evaluation - Evaluation result
   * @returns {boolean} True if handoff needed
   */
  checkTopicHandoff(conversation, evaluation) {
    const messages = conversation.messages || [];
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage) return false;

    const content = lastMessage.content || lastMessage.text || '';

    // Check escalation keywords
    const escalationRules = this.handoffRules.topics.escalation;
    if (escalationRules.keywords.some(keyword => content.includes(keyword))) {
      evaluation.shouldHandoff = true;
      evaluation.reason = 'escalation_request';
      evaluation.priority = escalationRules.priority;
      evaluation.confidence = 0.9;
      return true;
    }

    // Check complaint keywords
    const complaintRules = this.handoffRules.topics.complaints;
    if (complaintRules.keywords.some(keyword => content.includes(keyword))) {
      evaluation.shouldHandoff = true;
      evaluation.reason = 'customer_complaint';
      evaluation.priority = complaintRules.priority;
      evaluation.confidence = 0.8;
      return true;
    }

    return false;
  }

  /**
   * Check fallback handoff conditions
   * @param {Object} conversation - Conversation data
   * @param {Object} evaluation - Evaluation result
   * @returns {boolean} True if handoff needed
   */
  checkFallbackHandoff(conversation, evaluation) {
    const rules = this.handoffRules.fallback;
    const messages = conversation.messages || [];
    const botMessages = messages.filter(msg => msg.sender === 'bot' || msg.role === 'assistant');

    // Check message count limit
    if (botMessages.length >= rules.maxBotMessages) {
      evaluation.shouldHandoff = true;
      evaluation.reason = 'message_limit_exceeded';
      evaluation.priority = rules.priority;
      evaluation.confidence = 0.6;
      return true;
    }

    // Check time limit
    const startTime = new Date(conversation.createdAt || conversation.startTime);
    const now = new Date();
    const duration = now - startTime;

    if (duration >= rules.timeLimit) {
      evaluation.shouldHandoff = true;
      evaluation.reason = 'time_limit_exceeded';
      evaluation.priority = rules.priority;
      evaluation.confidence = 0.5;
      return true;
    }

    return false;
  }

  /**
   * Initiate handoff process
   * @param {string} conversationId - Conversation ID
   * @param {Object} evaluation - Handoff evaluation
   * @param {Object} conversation - Conversation data
   * @returns {Object} Handoff result
   */
  async initiateHandoff(conversationId, evaluation, conversation) {
    try {
      // Find available agent
      const availableAgent = await this.findAvailableAgent(evaluation.priority);

      if (!availableAgent) {
        // Queue for later
        this.queueHandoff(conversationId, evaluation, conversation);
        return {
          success: false,
          queued: true,
          message: 'تم وضع طلبك في قائمة الانتظار لمتحدث حقيقي'
        };
      }

      // Create handoff record
      const handoffId = this.generateHandoffId();
      const handoffRecord = {
        id: handoffId,
        conversationId,
        agentId: availableAgent.id,
        priority: evaluation.priority,
        reason: evaluation.reason,
        startedAt: new Date(),
        status: 'active',
        conversation: conversation
      };

      this.activeHandoffs.set(handoffId, handoffRecord);
      this.agentPool.get(availableAgent.id).status = 'busy';

      // Emit handoff event
      this.emit('handoffInitiated', handoffRecord);

      return {
        success: true,
        handoffId,
        agent: availableAgent,
        message: `تم تحويلك إلى متحدث حقيقي: ${availableAgent.name}`
      };

    } catch (error) {
      console.error('[AgentHandoff] Handoff initiation error:', error);
      this.qualityMetrics.handoffFailures++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find available agent based on priority
   * @param {string} priority - Handoff priority
   * @returns {Object} Available agent or null
   */
  async findAvailableAgent(priority) {
    // In a real implementation, this would query a database or agent management system
    // For demo purposes, we'll simulate agent availability

    const availableAgents = Array.from(this.agentPool.values())
      .filter(agent => agent.status === 'available')
      .sort((a, b) => {
        // Sort by priority handling capability
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    return availableAgents.length > 0 ? availableAgents[0] : null;
  }

  /**
   * Queue handoff for later processing
   * @param {string} conversationId - Conversation ID
   * @param {Object} evaluation - Handoff evaluation
   * @param {Object} conversation - Conversation data
   */
  queueHandoff(conversationId, evaluation, conversation) {
    const queueItem = {
      conversationId,
      evaluation,
      conversation,
      queuedAt: new Date(),
      priority: evaluation.priority
    };

    this.handoffQueue.set(conversationId, queueItem);

    // Emit queue event
    this.emit('handoffQueued', queueItem);
  }

  /**
   * Process handoff queue
   * @returns {Array} Processed handoffs
   */
  async processHandoffQueue() {
    const processed = [];

    for (const [conversationId, queueItem] of this.handoffQueue) {
      const availableAgent = await this.findAvailableAgent(queueItem.priority);

      if (availableAgent) {
        const result = await this.initiateHandoff(conversationId, queueItem.evaluation, queueItem.conversation);
        if (result.success) {
          this.handoffQueue.delete(conversationId);
          processed.push(result);
        }
      }
    }

    return processed;
  }

  /**
   * Complete handoff and collect feedback
   * @param {string} handoffId - Handoff ID
   * @param {Object} feedback - Customer feedback
   */
  completeHandoff(handoffId, feedback = {}) {
    const handoff = this.activeHandoffs.get(handoffId);

    if (!handoff) return;

    handoff.status = 'completed';
    handoff.completedAt = new Date();
    handoff.feedback = feedback;
    handoff.duration = handoff.completedAt - handoff.startedAt;

    // Update agent status
    const agent = this.agentPool.get(handoff.agentId);
    if (agent) {
      agent.status = 'available';
    }

    // Update quality metrics
    this.updateQualityMetrics(handoff);

    // Emit completion event
    this.emit('handoffCompleted', handoff);

    // Remove from active handoffs
    this.activeHandoffs.delete(handoffId);
  }

  /**
   * Update quality metrics
   * @param {Object} handoff - Completed handoff
   */
  updateQualityMetrics(handoff) {
    this.qualityMetrics.handoffSuccess++;

    if (handoff.duration) {
      const currentAvg = this.qualityMetrics.averageResolutionTime;
      const totalHandoffs = this.qualityMetrics.handoffSuccess + this.qualityMetrics.handoffFailures;
      this.qualityMetrics.averageResolutionTime =
        (currentAvg * (totalHandoffs - 1) + handoff.duration) / totalHandoffs;
    }

    if (handoff.feedback?.satisfaction) {
      const currentSat = this.qualityMetrics.customerSatisfaction;
      const totalFeedback = this.qualityMetrics.handoffSuccess;
      this.qualityMetrics.customerSatisfaction =
        (currentSat * (totalFeedback - 1) + handoff.feedback.satisfaction) / totalFeedback;
    }
  }

  /**
   * Add agent to pool
   * @param {Object} agent - Agent information
   */
  addAgent(agent) {
    this.agentPool.set(agent.id, {
      ...agent,
      status: 'available',
      joinedAt: new Date()
    });
  }

  /**
   * Remove agent from pool
   * @param {string} agentId - Agent ID
   */
  removeAgent(agentId) {
    this.agentPool.delete(agentId);
  }

  /**
   * Get agent pool status
   * @returns {Object} Agent pool status
   */
  getAgentPoolStatus() {
    const agents = Array.from(this.agentPool.values());
    const available = agents.filter(a => a.status === 'available').length;
    const busy = agents.filter(a => a.status === 'busy').length;

    return {
      total: agents.length,
      available,
      busy,
      utilization: agents.length > 0 ? busy / agents.length : 0
    };
  }

  /**
   * Get handoff statistics
   * @returns {Object} Handoff statistics
   */
  getHandoffStatistics() {
    const activeHandoffs = Array.from(this.activeHandoffs.values());
    const queuedHandoffs = Array.from(this.handoffQueue.values());

    return {
      active: activeHandoffs.length,
      queued: queuedHandoffs.length,
      totalToday: this.qualityMetrics.handoffSuccess + this.qualityMetrics.handoffFailures,
      successRate: this.getSuccessRate(),
      averageResolutionTime: Math.round(this.qualityMetrics.averageResolutionTime / (1000 * 60)), // minutes
      customerSatisfaction: Math.round(this.qualityMetrics.customerSatisfaction * 10) / 10,
      agentPool: this.getAgentPoolStatus()
    };
  }

  /**
   * Get success rate
   * @returns {number} Success rate percentage
   */
  getSuccessRate() {
    const total = this.qualityMetrics.handoffSuccess + this.qualityMetrics.handoffFailures;
    return total > 0 ? (this.qualityMetrics.handoffSuccess / total) * 100 : 0;
  }

  /**
   * Generate unique handoff ID
   * @returns {string} Handoff ID
   */
  generateHandoffId() {
    return `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get handoff by ID
   * @param {string} handoffId - Handoff ID
   * @returns {Object} Handoff record
   */
  getHandoff(handoffId) {
    return this.activeHandoffs.get(handoffId);
  }

  /**
   * Get queued handoff
   * @param {string} conversationId - Conversation ID
   * @returns {Object} Queued handoff
   */
  getQueuedHandoff(conversationId) {
    return this.handoffQueue.get(conversationId);
  }

  /**
   * Cancel handoff
   * @param {string} handoffId - Handoff ID
   */
  cancelHandoff(handoffId) {
    const handoff = this.activeHandoffs.get(handoffId);

    if (handoff) {
      // Free up agent
      const agent = this.agentPool.get(handoff.agentId);
      if (agent) {
        agent.status = 'available';
      }

      handoff.status = 'cancelled';
      this.activeHandoffs.delete(handoffId);

      this.emit('handoffCancelled', handoff);
    }
  }
}

module.exports = new AgentHandoffService();