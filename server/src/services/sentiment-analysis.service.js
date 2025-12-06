const natural = require('natural');
const SentimentAnalyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;

/**
 * Sentiment Analysis Service
 * Analyzes emotions in conversations and optimizes responses
 */
class SentimentAnalysisService {
  constructor() {
    this.analyzer = new SentimentAnalyzer('English', stemmer, 'afinn');
    this.arabicAnalyzer = this.initializeArabicAnalyzer();

    // Emotion keywords for Arabic
    this.emotionKeywords = {
      positive: [
        'ممتاز', 'رائع', 'جيد', 'عظيم', 'سعيد', 'مبسوط', 'فرحان',
        'ممتع', 'مفيد', 'مثالي', 'ممتاز جداً', 'أحب', 'أعجبني'
      ],
      negative: [
        'سيء', 'مضطرب', 'غاضب', 'حزين', 'مستاء', 'مشكلة', 'خطأ',
        'غير راضي', 'سيء جداً', 'أكره', 'مزعج', 'صعب', 'معقد'
      ],
      neutral: [
        'عادي', 'متوسط', 'طبيعي', 'لا بأس', 'مقبول', 'عادي جداً'
      ],
      urgent: [
        'عاجل', 'سريع', 'فوراً', 'حالاً', 'مهم', 'طارئ', 'أحتاج مساعدة'
      ]
    };

    this.sentimentHistory = new Map();
  }

  /**
   * Initialize Arabic sentiment analyzer
   * @returns {Object} Arabic analyzer configuration
   */
  initializeArabicAnalyzer() {
    return {
      analyze: (text) => this.analyzeArabicSentiment(text)
    };
  }

  /**
   * Analyze sentiment of a message
   * @param {string} message - Message to analyze
   * @param {string} language - Language code (ar, en)
   * @returns {Object} Sentiment analysis result
   */
  analyzeSentiment(message, language = 'ar') {
    try {
      let result;

      if (language === 'ar') {
        result = this.analyzeArabicSentiment(message);
      } else {
        result = this.analyzeEnglishSentiment(message);
      }

      // Store in history for trend analysis
      this.storeSentiment(message, result);

      return result;

    } catch (error) {
      console.error('[SentimentAnalysis] Analysis error:', error);
      return this.getNeutralSentiment();
    }
  }

  /**
   * Analyze Arabic sentiment
   * @param {string} text - Arabic text
   * @returns {Object} Sentiment result
   */
  analyzeArabicSentiment(text) {
    const words = text.split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let urgentScore = 0;

    words.forEach(word => {
      // Check positive keywords
      if (this.emotionKeywords.positive.some(keyword => word.includes(keyword))) {
        positiveScore += 1;
      }

      // Check negative keywords
      if (this.emotionKeywords.negative.some(keyword => word.includes(keyword))) {
        negativeScore += 1;
      }

      // Check urgent keywords
      if (this.emotionKeywords.urgent.some(keyword => word.includes(keyword))) {
        urgentScore += 1;
      }
    });

    const totalScore = positiveScore - negativeScore;
    const magnitude = Math.abs(totalScore);

    let sentiment = 'neutral';
    let confidence = 0.5;

    if (totalScore > 0.5) {
      sentiment = 'positive';
      confidence = Math.min(0.9, magnitude / words.length);
    } else if (totalScore < -0.5) {
      sentiment = 'negative';
      confidence = Math.min(0.9, magnitude / words.length);
    }

    return {
      sentiment,
      score: totalScore,
      confidence,
      magnitude,
      emotions: {
        positive: positiveScore,
        negative: negativeScore,
        urgent: urgentScore
      },
      language: 'ar'
    };
  }

  /**
   * Analyze English sentiment
   * @param {string} text - English text
   * @returns {Object} Sentiment result
   */
  analyzeEnglishSentiment(text) {
    const score = this.analyzer.getSentiment(text.split(' '));
    const magnitude = Math.abs(score);

    let sentiment = 'neutral';
    let confidence = 0.5;

    if (score > 0.1) {
      sentiment = 'positive';
      confidence = Math.min(0.9, magnitude);
    } else if (score < -0.1) {
      sentiment = 'negative';
      confidence = Math.min(0.9, magnitude);
    }

    return {
      sentiment,
      score,
      confidence,
      magnitude,
      language: 'en'
    };
  }

  /**
   * Get neutral sentiment result
   * @returns {Object} Neutral sentiment
   */
  getNeutralSentiment() {
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0.5,
      magnitude: 0,
      language: 'unknown'
    };
  }

  /**
   * Store sentiment for trend analysis
   * @param {string} message - Original message
   * @param {Object} sentiment - Sentiment result
   */
  storeSentiment(message, sentiment) {
    const key = Date.now().toString();
    this.sentimentHistory.set(key, {
      message,
      sentiment,
      timestamp: new Date()
    });

    // Keep only last 1000 entries
    if (this.sentimentHistory.size > 1000) {
      const oldestKey = this.sentimentHistory.keys().next().value;
      this.sentimentHistory.delete(oldestKey);
    }
  }

  /**
   * Get sentiment trends over time
   * @param {number} hours - Hours to look back
   * @returns {Object} Sentiment trends
   */
  getSentimentTrends(hours = 24) {
    const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const recentSentiments = Array.from(this.sentimentHistory.values())
      .filter(entry => entry.timestamp > cutoff);

    const trends = {
      total: recentSentiments.length,
      positive: 0,
      negative: 0,
      neutral: 0,
      averageScore: 0,
      urgentCount: 0
    };

    let totalScore = 0;

    recentSentiments.forEach(entry => {
      const sentiment = entry.sentiment.sentiment;
      trends[sentiment]++;

      if (entry.sentiment.score !== undefined) {
        totalScore += entry.sentiment.score;
      }

      if (entry.sentiment.emotions?.urgent > 0) {
        trends.urgentCount++;
      }
    });

    trends.averageScore = trends.total > 0 ? totalScore / trends.total : 0;

    return trends;
  }

  /**
   * Optimize response based on sentiment
   * @param {string} baseResponse - Base response
   * @param {Object} sentiment - Sentiment analysis
   * @returns {string} Optimized response
   */
  optimizeResponse(baseResponse, sentiment) {
    let optimizedResponse = baseResponse;

    switch (sentiment.sentiment) {
      case 'positive':
        // Enhance positive responses
        optimizedResponse = this.enhancePositiveResponse(optimizedResponse);
        break;

      case 'negative':
        // Soften and empathize with negative sentiment
        optimizedResponse = this.handleNegativeSentiment(optimizedResponse, sentiment);
        break;

      case 'neutral':
        // Keep neutral responses as-is
        break;
    }

    // Handle urgent sentiment
    if (sentiment.emotions?.urgent > 0) {
      optimizedResponse = this.handleUrgentSentiment(optimizedResponse);
    }

    return optimizedResponse;
  }

  /**
   * Enhance positive responses
   * @param {string} response - Base response
   * @returns {string} Enhanced response
   */
  enhancePositiveResponse(response) {
    const enhancers = [
      'أنا سعيد بمساعدتك!',
      'يسرني أن أكون مفيداً لك.',
      'أتمنى أن تكون الإجابة مفيدة.'
    ];

    const randomEnhancer = enhancers[Math.floor(Math.random() * enhancers.length)];
    return `${response}\n\n${randomEnhancer}`;
  }

  /**
   * Handle negative sentiment
   * @param {string} response - Base response
   * @param {Object} sentiment - Sentiment details
   * @returns {string} Empathetic response
   */
  handleNegativeSentiment(response, sentiment) {
    const empathizers = [
      'أعتذر عن أي إزعاج.',
      'أفهم مخاوفك وأريد مساعدتك.',
      'دعني أساعدك في حل هذه المشكلة.'
    ];

    const randomEmpathizer = empathizers[Math.floor(Math.random() * empathizers.length)];
    return `${randomEmpathizer}\n\n${response}`;
  }

  /**
   * Handle urgent sentiment
   * @param {string} response - Base response
   * @returns {string} Urgent response
   */
  handleUrgentSentiment(response) {
    const urgentPrefixes = [
      'أفهم أن هذا عاجل. ',
      'سأتعامل مع هذا فوراً. ',
      'دعني أساعدك في هذا الأمر العاجل. '
    ];

    const randomPrefix = urgentPrefixes[Math.floor(Math.random() * urgentPrefixes.length)];
    return `${randomPrefix}${response}`;
  }

  /**
   * Analyze conversation sentiment
   * @param {Array} messages - Array of conversation messages
   * @returns {Object} Conversation sentiment analysis
   */
  analyzeConversation(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return this.getNeutralSentiment();
    }

    const sentiments = messages.map(msg =>
      this.analyzeSentiment(msg.content || msg.text || msg, msg.language)
    );

    const averageScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
    const dominantSentiment = this.getDominantSentiment(sentiments);

    return {
      overallSentiment: dominantSentiment,
      averageScore,
      messageCount: messages.length,
      sentimentDistribution: this.getSentimentDistribution(sentiments),
      trend: this.analyzeSentimentTrend(sentiments)
    };
  }

  /**
   * Get dominant sentiment from multiple analyses
   * @param {Array} sentiments - Array of sentiment results
   * @returns {string} Dominant sentiment
   */
  getDominantSentiment(sentiments) {
    const counts = sentiments.reduce((acc, s) => {
      acc[s.sentiment] = (acc[s.sentiment] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  /**
   * Get sentiment distribution
   * @param {Array} sentiments - Array of sentiment results
   * @returns {Object} Distribution counts
   */
  getSentimentDistribution(sentiments) {
    return sentiments.reduce((acc, s) => {
      acc[s.sentiment] = (acc[s.sentiment] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Analyze sentiment trend in conversation
   * @param {Array} sentiments - Array of sentiment results
   * @returns {string} Trend description
   */
  analyzeSentimentTrend(sentiments) {
    if (sentiments.length < 2) return 'stable';

    const scores = sentiments.map(s => s.score);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 0.2) return 'improving';
    if (diff < -0.2) return 'declining';
    return 'stable';
  }
}

module.exports = new SentimentAnalysisService();