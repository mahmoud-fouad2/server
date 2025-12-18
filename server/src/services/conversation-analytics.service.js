import natural from 'natural';
const TfIdf = natural.TfIdf;

/**
 * Conversation Analytics Service
 * Provides topic detection, sentiment trends, and reporting dashboard
 */
class ConversationAnalyticsService {
  constructor() {
    this.tfidf = new TfIdf();
    this.conversationCache = new Map();
    this.topicModel = this.initializeTopicModel();

    // Analytics data storage
    this.analyticsData = {
      dailyStats: new Map(),
      topicTrends: new Map(),
      userBehavior: new Map(),
      performanceMetrics: new Map()
    };
  }

  /**
   * Initialize topic model with common Arabic topics
   * @returns {Object} Topic model
   */
  initializeTopicModel() {
    return {
      topics: {
        'استفسارات_عامة': {
          keywords: ['كيف', 'ماذا', 'ما', 'هل', 'متى', 'أين', 'لماذا'],
          weight: 1.0
        },
        'دعم_تقني': {
          keywords: ['مشكلة', 'خطأ', 'لا يعمل', 'بطيء', 'معطل', 'تحديث', 'إصلاح'],
          weight: 1.2
        },
        'مبيعات': {
          keywords: ['سعر', 'شراء', 'طلب', 'عرض', 'خصم', 'تكلفة', 'أسعار'],
          weight: 1.1
        },
        'خدمة_العملاء': {
          keywords: ['شكوى', 'استعلام', 'طلب', 'مساعدة', 'دعم', 'اتصال'],
          weight: 1.0
        },
        'معلومات': {
          keywords: ['معلومات', 'تفاصيل', 'شرح', 'وصف', 'كيفية', 'دليل'],
          weight: 0.9
        },
        'تحية': {
          keywords: ['مرحبا', 'السلام', 'صباح', 'مساء', 'أهلاً', 'كيفك'],
          weight: 0.7
        }
      }
    };
  }

  /**
   * Analyze conversation and extract insights
   * @param {Array} messages - Conversation messages
   * @param {string} conversationId - Conversation ID
   * @returns {Object} Conversation analysis
   */
  analyzeConversation(messages, conversationId) {
    const analysis = {
      conversationId,
      messageCount: messages.length,
      topics: [],
      sentiment: {},
      duration: 0,
      userEngagement: {},
      keyInsights: []
    };

    if (messages.length === 0) return analysis;

    // Extract topics
    analysis.topics = this.extractTopics(messages);

    // Analyze sentiment trends
    analysis.sentiment = this.analyzeSentimentTrends(messages);

    // Calculate conversation duration
    analysis.duration = this.calculateDuration(messages);

    // Analyze user engagement
    analysis.userEngagement = this.analyzeUserEngagement(messages);

    // Generate key insights
    analysis.keyInsights = this.generateKeyInsights(analysis);

    // Store for trend analysis
    this.storeConversationAnalysis(conversationId, analysis);

    return analysis;
  }

  /**
   * Extract topics from conversation messages
   * @param {Array} messages - Conversation messages
   * @returns {Array} Detected topics with confidence
   */
  extractTopics(messages) {
    const topicScores = {};

    messages.forEach(message => {
      const text = message.content || message.text || '';
      const words = this.tokenizeArabic(text);

      // Calculate topic scores
      Object.entries(this.topicModel.topics).forEach(([topic, config]) => {
        let score = 0;
        config.keywords.forEach(keyword => {
          const count = words.filter(word => word.includes(keyword)).length;
          score += count * config.weight;
        });

        if (score > 0) {
          topicScores[topic] = (topicScores[topic] || 0) + score;
        }
      });
    });

    // Convert to sorted array with confidence
    const totalMessages = messages.length;
    return Object.entries(topicScores)
      .map(([topic, score]) => ({
        topic,
        score,
        confidence: Math.min(1.0, score / totalMessages)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 topics
  }

  /**
   * Tokenize Arabic text
   * @param {string} text - Arabic text
   * @returns {Array} Tokenized words
   */
  tokenizeArabic(text) {
    // Simple Arabic tokenization (can be enhanced with proper Arabic NLP)
    return text
      .replace(/[^\u0600-\u06FF\s]/g, '') // Keep only Arabic characters and spaces
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Analyze sentiment trends in conversation
   * @param {Array} messages - Conversation messages
   * @returns {Object} Sentiment analysis
   */
  analyzeSentimentTrends(messages) {
    // This would integrate with the sentiment analysis service
    // For now, return mock data structure
    const sentiments = messages.map(msg => ({
      sentiment: msg.sentiment || 'neutral',
      score: msg.sentimentScore || 0,
      timestamp: msg.timestamp || new Date()
    }));

    const distribution = sentiments.reduce((acc, s) => {
      acc[s.sentiment] = (acc[s.sentiment] || 0) + 1;
      return acc;
    }, {});

    const averageScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;

    return {
      distribution,
      averageScore,
      trend: this.calculateSentimentTrend(sentiments),
      timeline: sentiments
    };
  }

  /**
   * Calculate sentiment trend
   * @param {Array} sentiments - Sentiment timeline
   * @returns {string} Trend direction
   */
  calculateSentimentTrend(sentiments) {
    if (sentiments.length < 2) return 'stable';

    const firstHalf = sentiments.slice(0, Math.floor(sentiments.length / 2));
    const secondHalf = sentiments.slice(Math.floor(sentiments.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + s.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.score, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 0.1) return 'improving';
    if (secondAvg < firstAvg - 0.1) return 'declining';
    return 'stable';
  }

  /**
   * Calculate conversation duration
   * @param {Array} messages - Conversation messages
   * @returns {number} Duration in minutes
   */
  calculateDuration(messages) {
    if (messages.length < 2) return 0;

    const timestamps = messages
      .map(msg => new Date(msg.timestamp || msg.createdAt))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a - b);

    if (timestamps.length < 2) return 0;

    const duration = timestamps[timestamps.length - 1] - timestamps[0];
    return Math.round(duration / (1000 * 60)); // Convert to minutes
  }

  /**
   * Analyze user engagement patterns
   * @param {Array} messages - Conversation messages
   * @returns {Object} Engagement metrics
   */
  analyzeUserEngagement(messages) {
    const userMessages = messages.filter(msg => msg.sender === 'user' || msg.role === 'user');
    const botMessages = messages.filter(msg => msg.sender === 'bot' || msg.role === 'assistant');

    return {
      userMessageCount: userMessages.length,
      botMessageCount: botMessages.length,
      averageUserMessageLength: this.calculateAverageLength(userMessages),
      averageBotMessageLength: this.calculateAverageLength(botMessages),
      responseTime: this.calculateAverageResponseTime(messages),
      conversationFlow: this.analyzeConversationFlow(messages)
    };
  }

  /**
   * Calculate average message length
   * @param {Array} messages - Messages to analyze
   * @returns {number} Average length
   */
  calculateAverageLength(messages) {
    if (messages.length === 0) return 0;

    const totalLength = messages.reduce((sum, msg) => {
      const content = msg.content || msg.text || '';
      return sum + content.length;
    }, 0);

    return Math.round(totalLength / messages.length);
  }

  /**
   * Calculate average response time
   * @param {Array} messages - Conversation messages
   * @returns {number} Average response time in seconds
   */
  calculateAverageResponseTime(messages) {
    const responseTimes = [];

    for (let i = 1; i < messages.length; i++) {
      const current = messages[i];
      const previous = messages[i - 1];

      if (current.sender !== previous.sender) {
        const timeDiff = new Date(current.timestamp) - new Date(previous.timestamp);
        if (timeDiff > 0 && timeDiff < 300000) { // Less than 5 minutes
          responseTimes.push(timeDiff / 1000); // Convert to seconds
        }
      }
    }

    return responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
  }

  /**
   * Analyze conversation flow
   * @param {Array} messages - Conversation messages
   * @returns {Object} Flow analysis
   */
  analyzeConversationFlow(messages) {
    let turns = 0;
    let currentSpeaker = null;

    messages.forEach(msg => {
      const speaker = msg.sender || msg.role;
      if (speaker !== currentSpeaker) {
        turns++;
        currentSpeaker = speaker;
      }
    });

    return {
      totalTurns: turns,
      averageTurnsPerMinute: this.calculateDuration(messages) > 0
        ? turns / this.calculateDuration(messages)
        : 0
    };
  }

  /**
   * Generate key insights from analysis
   * @param {Object} analysis - Conversation analysis
   * @returns {Array} Key insights
   */
  generateKeyInsights(analysis) {
    const insights = [];

    // Topic insights
    if (analysis.topics.length > 0) {
      const topTopic = analysis.topics[0];
      insights.push(`الموضوع الرئيسي: ${topTopic.topic.replace('_', ' ')}`);
    }

    // Sentiment insights
    const sentiment = analysis.sentiment;
    if (sentiment.trend === 'improving') {
      insights.push('تحسن المزاج خلال المحادثة');
    } else if (sentiment.trend === 'declining') {
      insights.push('تدهور المزاج خلال المحادثة');
    }

    // Engagement insights
    const engagement = analysis.userEngagement;
    if (engagement.responseTime > 60) {
      insights.push('وقت الرد طويل نسبياً');
    }

    if (engagement.userMessageCount > engagement.botMessageCount * 2) {
      insights.push('المستخدم يطرح أسئلة كثيرة');
    }

    return insights;
  }

  /**
   * Store conversation analysis for trend analysis
   * @param {string} conversationId - Conversation ID
   * @param {Object} analysis - Analysis data
   */
  storeConversationAnalysis(conversationId, analysis) {
    this.conversationCache.set(conversationId, {
      ...analysis,
      storedAt: new Date()
    });

    // Update daily stats
    this.updateDailyStats(analysis);

    // Keep cache size manageable
    if (this.conversationCache.size > 1000) {
      const oldestKey = Array.from(this.conversationCache.keys())[0];
      this.conversationCache.delete(oldestKey);
    }
  }

  /**
   * Update daily statistics
   * @param {Object} analysis - Conversation analysis
   */
  updateDailyStats(analysis) {
    const today = new Date().toISOString().split('T')[0];

    if (!this.analyticsData.dailyStats.has(today)) {
      this.analyticsData.dailyStats.set(today, {
        conversations: 0,
        messages: 0,
        averageSentiment: 0,
        topTopics: {},
        totalDuration: 0
      });
    }

    const stats = this.analyticsData.dailyStats.get(today);
    stats.conversations++;
    stats.messages += analysis.messageCount;
    stats.averageSentiment = (stats.averageSentiment + analysis.sentiment.averageScore) / 2;
    stats.totalDuration += analysis.duration;

    // Update top topics
    analysis.topics.forEach(topic => {
      stats.topTopics[topic.topic] = (stats.topTopics[topic.topic] || 0) + 1;
    });
  }

  /**
   * Get daily analytics report
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Object} Daily report
   */
  getDailyReport(date) {
    const stats = this.analyticsData.dailyStats.get(date);
    if (!stats) return null;

    return {
      date,
      conversations: stats.conversations,
      messages: stats.messages,
      averageSentiment: Math.round(stats.averageSentiment * 100) / 100,
      averageDuration: Math.round(stats.totalDuration / stats.conversations),
      topTopics: Object.entries(stats.topTopics)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count }))
    };
  }

  /**
   * Get analytics dashboard data
   * @param {number} days - Number of days to include
   * @returns {Object} Dashboard data
   */
  getDashboardData(days = 7) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const dashboard = {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      summary: {
        totalConversations: 0,
        totalMessages: 0,
        averageSentiment: 0,
        averageDuration: 0
      },
      trends: {
        conversations: [],
        sentiment: [],
        topics: {}
      },
      topTopics: [],
      performance: {}
    };

    let totalSentiment = 0;
    let conversationCount = 0;

    // Collect data for each day
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      const dailyStats = this.analyticsData.dailyStats.get(dateStr);

      if (dailyStats) {
        dashboard.trends.conversations.push({
          date: dateStr,
          count: dailyStats.conversations
        });

        dashboard.trends.sentiment.push({
          date: dateStr,
          score: Math.round(dailyStats.averageSentiment * 100) / 100
        });

        dashboard.summary.totalConversations += dailyStats.conversations;
        dashboard.summary.totalMessages += dailyStats.messages;
        totalSentiment += dailyStats.averageSentiment;
        conversationCount++;

        // Aggregate topics
        Object.entries(dailyStats.topTopics).forEach(([topic, count]) => {
          dashboard.trends.topics[topic] = (dashboard.trends.topics[topic] || 0) + count;
        });
      } else {
        dashboard.trends.conversations.push({ date: dateStr, count: 0 });
        dashboard.trends.sentiment.push({ date: dateStr, score: 0 });
      }
    }

    // Calculate averages
    if (conversationCount > 0) {
      dashboard.summary.averageSentiment = Math.round((totalSentiment / conversationCount) * 100) / 100;
      dashboard.summary.averageDuration = Math.round(
        Array.from(this.analyticsData.dailyStats.values())
          .reduce((sum, stats) => sum + (stats.totalDuration / stats.conversations || 0), 0) / conversationCount
      );
    }

    // Get top topics
    dashboard.topTopics = Object.entries(dashboard.trends.topics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic: topic.replace('_', ' '), count }));

    return dashboard;
  }

  /**
   * Export analytics data
   * @param {string} format - Export format (json, csv)
   * @param {number} days - Number of days to export
   * @returns {string} Exported data
   */
  exportAnalyticsData(format = 'json', days = 30) {
    const data = this.getDashboardData(days);

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Convert dashboard data to CSV
   * @param {Object} data - Dashboard data
   * @returns {string} CSV string
   */
  convertToCSV(data) {
    let csv = 'Date,Conversations,Sentiment\n';

    data.trends.conversations.forEach((conv, index) => {
      const sentiment = data.trends.sentiment[index];
      csv += `${conv.date},${conv.count},${sentiment.score}\n`;
    });

    return csv;
  }
}

export default new ConversationAnalyticsService();