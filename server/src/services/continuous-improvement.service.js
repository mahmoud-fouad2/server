const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Continuous Improvement Service
 * Handles auto-update knowledge bases and gap detection
 */
class ContinuousImprovementService {
  constructor() {
    this.knowledgeBaseUpdates = new Map();
    this.gapAnalysis = new Map();
    this.improvementMetrics = new Map();
    this.feedbackLoop = new Map();

    // Configuration
    this.config = {
      autoUpdateThreshold: 10, // Minimum new queries before update
      gapDetectionInterval: 24 * 60 * 60 * 1000, // 24 hours
      knowledgeRefreshInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
      feedbackAnalysisInterval: 60 * 60 * 1000 // 1 hour
    };

    this.initializeImprovementTracking();
  }

  /**
   * Initialize improvement tracking
   */
  initializeImprovementTracking() {
    // Start background processes
    this.startGapDetection();
    this.startKnowledgeBaseUpdates();
    this.startFeedbackAnalysis();
  }

  /**
   * Track user query for improvement analysis
   * @param {string} businessId - Business ID
   * @param {string} query - User query
   * @param {Object} response - System response
   * @param {Object} metadata - Additional metadata
   */
  async trackQuery(businessId, query, response, metadata = {}) {
    const trackingData = {
      query,
      response,
      timestamp: new Date(),
      businessId,
      responseQuality: metadata.responseQuality || 'unknown',
      userSatisfaction: metadata.userSatisfaction || null,
      fallbackUsed: metadata.fallbackUsed || false,
      processingTime: metadata.processingTime || 0,
      conversationId: metadata.conversationId
    };

    // Store for gap analysis
    this.storeQueryForGapAnalysis(businessId, trackingData);

    // Check for knowledge base updates
    await this.checkKnowledgeBaseUpdate(businessId, trackingData);

    // Update improvement metrics
    this.updateImprovementMetrics(businessId, trackingData);
  }

  /**
   * Store query for gap analysis
   * @param {string} businessId - Business ID
   * @param {Object} trackingData - Query tracking data
   */
  storeQueryForGapAnalysis(businessId, trackingData) {
    if (!this.gapAnalysis.has(businessId)) {
      this.gapAnalysis.set(businessId, {
        queries: [],
        gaps: [],
        lastAnalysis: null
      });
    }

    const analysis = this.gapAnalysis.get(businessId);
    analysis.queries.push(trackingData);

    // Keep only last 1000 queries for analysis
    if (analysis.queries.length > 1000) {
      analysis.queries = analysis.queries.slice(-1000);
    }
  }

  /**
   * Check if knowledge base needs update
   * @param {string} businessId - Business ID
   * @param {Object} trackingData - Query tracking data
   */
  async checkKnowledgeBaseUpdate(businessId, trackingData) {
    if (!this.knowledgeBaseUpdates.has(businessId)) {
      this.knowledgeBaseUpdates.set(businessId, {
        pendingUpdates: [],
        lastUpdate: null,
        updateCount: 0
      });
    }

    const updates = this.knowledgeBaseUpdates.get(businessId);

    // Check if this indicates a knowledge gap
    if (this.isKnowledgeGap(trackingData)) {
      updates.pendingUpdates.push({
        type: 'gap_filling',
        query: trackingData.query,
        response: trackingData.response,
        timestamp: trackingData.timestamp,
        priority: this.calculateUpdatePriority(trackingData)
      });
    }

    // Trigger update if threshold reached
    if (updates.pendingUpdates.length >= this.config.autoUpdateThreshold) {
      await this.performKnowledgeBaseUpdate(businessId);
    }
  }

  /**
   * Determine if query indicates knowledge gap
   * @param {Object} trackingData - Query tracking data
   * @returns {boolean} True if knowledge gap detected
   */
  isKnowledgeGap(trackingData) {
    // Low confidence responses
    if (trackingData.response.confidence < 0.3) return true;

    // Fallback responses
    if (trackingData.fallbackUsed) return true;

    // Low user satisfaction
    if (trackingData.userSatisfaction && trackingData.userSatisfaction < 3) return true;

    // Generic or unhelpful responses
    const genericResponses = [
      'لا أعرف', 'غير متأكد', 'لا أستطيع المساعدة', 'عذراً'
    ];

    if (genericResponses.some(resp =>
      trackingData.response.text?.includes(resp)
    )) return true;

    return false;
  }

  /**
   * Calculate update priority
   * @param {Object} trackingData - Query tracking data
   * @returns {string} Priority level
   */
  calculateUpdatePriority(trackingData) {
    let priority = 'low';

    if (trackingData.userSatisfaction && trackingData.userSatisfaction <= 2) {
      priority = 'high';
    } else if (trackingData.fallbackUsed || trackingData.response.confidence < 0.2) {
      priority = 'medium';
    }

    return priority;
  }

  /**
   * Perform knowledge base update
   * @param {string} businessId - Business ID
   */
  async performKnowledgeBaseUpdate(businessId) {
    const updates = this.knowledgeBaseUpdates.get(businessId);
    if (!updates || updates.pendingUpdates.length === 0) return;

    try {
      // Group updates by priority
      const highPriority = updates.pendingUpdates.filter(u => u.priority === 'high');
      const mediumPriority = updates.pendingUpdates.filter(u => u.priority === 'medium');
      const lowPriority = updates.pendingUpdates.filter(u => u.priority === 'low');

      // Process high priority updates first
      const updatesToProcess = [...highPriority, ...mediumPriority, ...lowPriority];

      for (const update of updatesToProcess) {
        await this.processKnowledgeUpdate(businessId, update);
      }

      // Clear processed updates
      updates.pendingUpdates = [];
      updates.lastUpdate = new Date();
      updates.updateCount++;

      logger.info(`[ContinuousImprovement] Knowledge base updated for ${businessId}: ${updatesToProcess.length} updates processed`, { processed: updatesToProcess.length });

    } catch (error) {
      logger.error('[ContinuousImprovement] Knowledge base update error:', error);
    }
  }

  /**
   * Process individual knowledge update
   * @param {string} businessId - Business ID
   * @param {Object} update - Update data
   */
  async processKnowledgeUpdate(businessId, update) {
    // In a real implementation, this would:
    // 1. Generate improved response using AI
    // 2. Add to knowledge base
    // 3. Update vector embeddings
    // 4. Validate the update

    // For demo, we'll simulate the process
    const improvedResponse = await this.generateImprovedResponse(update.query, update.response);

    // Store the improvement
    await this.storeKnowledgeImprovement(businessId, {
      originalQuery: update.query,
      originalResponse: update.response,
      improvedResponse,
      improvementType: update.type,
      timestamp: new Date(),
      priority: update.priority
    });
  }

  /**
   * Generate improved response
   * @param {string} query - Original query
   * @param {Object} originalResponse - Original response
   * @returns {string} Improved response
   */
  async generateImprovedResponse(query, originalResponse) {
    // In a real implementation, this would use AI to generate better responses
    // For demo, we'll return a placeholder
    return `تحسين للاستعلام: "${query}" - إجابة محسنة وأكثر تفصيلاً`;
  }

  /**
   * Store knowledge improvement
   * @param {string} businessId - Business ID
   * @param {Object} improvement - Improvement data
   */
  async storeKnowledgeImprovement(businessId, improvement) {
    // In a real implementation, this would store in database
    // For demo, we'll store in memory
    if (!this.improvementMetrics.has(businessId)) {
      this.improvementMetrics.set(businessId, {
        improvements: [],
        metrics: {}
      });
    }

    const metrics = this.improvementMetrics.get(businessId);
    metrics.improvements.push(improvement);
  }

  /**
   * Update improvement metrics
   * @param {string} businessId - Business ID
   * @param {Object} trackingData - Query tracking data
   */
  updateImprovementMetrics(businessId, trackingData) {
    if (!this.improvementMetrics.has(businessId)) {
      this.improvementMetrics.set(businessId, {
        improvements: [],
        metrics: {
          totalQueries: 0,
          knowledgeGaps: 0,
          improvementsMade: 0,
          averageResponseQuality: 0,
          userSatisfactionTrend: []
        }
      });
    }

    const metrics = this.improvementMetrics.get(businessId);
    metrics.metrics.totalQueries++;

    if (this.isKnowledgeGap(trackingData)) {
      metrics.metrics.knowledgeGaps++;
    }

    // Update average response quality
    const currentAvg = metrics.metrics.averageResponseQuality;
    const newQuality = trackingData.responseQuality === 'good' ? 1 :
                      trackingData.responseQuality === 'average' ? 0.5 : 0;
    metrics.metrics.averageResponseQuality =
      (currentAvg * (metrics.metrics.totalQueries - 1) + newQuality) / metrics.metrics.totalQueries;

    // Track user satisfaction
    if (trackingData.userSatisfaction) {
      metrics.metrics.userSatisfactionTrend.push({
        satisfaction: trackingData.userSatisfaction,
        timestamp: trackingData.timestamp
      });

      // Keep only last 100 satisfaction scores
      if (metrics.metrics.userSatisfactionTrend.length > 100) {
        metrics.metrics.userSatisfactionTrend = metrics.metrics.userSatisfactionTrend.slice(-100);
      }
    }
  }

  /**
   * Perform gap analysis
   * @param {string} businessId - Business ID
   * @returns {Object} Gap analysis results
   */
  async performGapAnalysis(businessId) {
    const analysis = this.gapAnalysis.get(businessId);
    if (!analysis || analysis.queries.length === 0) {
      return { gaps: [], recommendations: [] };
    }

    const gaps = [];
    const queryPatterns = this.analyzeQueryPatterns(analysis.queries);

    // Identify frequent gap patterns
    for (const [pattern, queries] of Object.entries(queryPatterns)) {
      const gapPercentage = queries.length / analysis.queries.length;
      if (gapPercentage > 0.05) { // More than 5% of queries
        gaps.push({
          pattern,
          frequency: queries.length,
          percentage: gapPercentage,
          sampleQueries: queries.slice(0, 3),
          severity: this.calculateGapSeverity(queries)
        });
      }
    }

    const recommendations = this.generateGapRecommendations(gaps);

    analysis.gaps = gaps;
    analysis.lastAnalysis = new Date();

    return {
      gaps,
      recommendations,
      analyzedQueries: analysis.queries.length,
      analysisTimestamp: new Date()
    };
  }

  /**
   * Analyze query patterns
   * @param {Array} queries - Query data
   * @returns {Object} Query patterns
   */
  analyzeQueryPatterns(queries) {
    const patterns = {};

    queries.forEach(query => {
      // Simple pattern extraction (can be enhanced with NLP)
      const words = query.query.toLowerCase().split(/\s+/);
      const keyWords = words.filter(word => word.length > 3);

      keyWords.forEach(word => {
        if (!patterns[word]) {
          patterns[word] = [];
        }
        patterns[word].push(query);
      });
    });

    return patterns;
  }

  /**
   * Calculate gap severity
   * @param {Array} queries - Queries in gap
   * @returns {string} Severity level
   */
  calculateGapSeverity(queries) {
    const avgSatisfaction = queries
      .filter(q => q.userSatisfaction)
      .reduce((sum, q) => sum + q.userSatisfaction, 0) /
      queries.filter(q => q.userSatisfaction).length;

    if (avgSatisfaction && avgSatisfaction < 2) return 'high';
    if (avgSatisfaction && avgSatisfaction < 3) return 'medium';
    return 'low';
  }

  /**
   * Generate gap recommendations
   * @param {Array} gaps - Identified gaps
   * @returns {Array} Recommendations
   */
  generateGapRecommendations(gaps) {
    const recommendations = [];

    gaps.forEach(gap => {
      if (gap.severity === 'high') {
        recommendations.push({
          type: 'urgent_knowledge_update',
          description: `إضافة معرفة جديدة للأسئلة المتعلقة بـ "${gap.pattern}"`,
          priority: 'high',
          estimatedEffort: 'high'
        });
      } else if (gap.severity === 'medium') {
        recommendations.push({
          type: 'response_improvement',
          description: `تحسين الإجابات للأسئلة المتعلقة بـ "${gap.pattern}"`,
          priority: 'medium',
          estimatedEffort: 'medium'
        });
      }
    });

    return recommendations;
  }

  /**
   * Get improvement dashboard data
   * @param {string} businessId - Business ID
   * @returns {Object} Dashboard data
   */
  getImprovementDashboard(businessId) {
    const metrics = this.improvementMetrics.get(businessId);
    const analysis = this.gapAnalysis.get(businessId);
    const updates = this.knowledgeBaseUpdates.get(businessId);

    if (!metrics) {
      return this.getEmptyDashboard();
    }

    return {
      overview: {
        totalQueries: metrics.metrics.totalQueries,
        knowledgeGaps: metrics.metrics.knowledgeGaps,
        improvementsMade: metrics.improvements?.length || 0,
        averageResponseQuality: Math.round(metrics.metrics.averageResponseQuality * 100) / 100,
        gapPercentage: metrics.metrics.totalQueries > 0 ?
          Math.round((metrics.metrics.knowledgeGaps / metrics.metrics.totalQueries) * 100) : 0
      },
      trends: {
        userSatisfaction: metrics.metrics.userSatisfactionTrend.slice(-10),
        knowledgeGaps: this.calculateGapTrend(analysis?.queries || []),
        improvements: this.calculateImprovementTrend(metrics.improvements || [])
      },
      gaps: analysis?.gaps || [],
      recentImprovements: metrics.improvements?.slice(-5) || [],
      recommendations: analysis ? this.generateGapRecommendations(analysis.gaps || []) : [],
      lastAnalysis: analysis?.lastAnalysis || null,
      lastUpdate: updates?.lastUpdate || null
    };
  }

  /**
   * Get empty dashboard
   * @returns {Object} Empty dashboard
   */
  getEmptyDashboard() {
    return {
      overview: {
        totalQueries: 0,
        knowledgeGaps: 0,
        improvementsMade: 0,
        averageResponseQuality: 0,
        gapPercentage: 0
      },
      trends: {
        userSatisfaction: [],
        knowledgeGaps: [],
        improvements: []
      },
      gaps: [],
      recentImprovements: [],
      recommendations: []
    };
  }

  /**
   * Calculate gap trend
   * @param {Array} queries - Query data
   * @returns {Array} Gap trend data
   */
  calculateGapTrend(queries) {
    // Group by day and calculate gaps
    const dailyGaps = {};

    queries.forEach(query => {
      const day = query.timestamp.toISOString().split('T')[0];
      if (!dailyGaps[day]) {
        dailyGaps[day] = { total: 0, gaps: 0 };
      }
      dailyGaps[day].total++;
      if (this.isKnowledgeGap(query)) {
        dailyGaps[day].gaps++;
      }
    });

    return Object.entries(dailyGaps)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7) // Last 7 days
      .map(([date, data]) => ({
        date,
        gapPercentage: data.total > 0 ? (data.gaps / data.total) * 100 : 0
      }));
  }

  /**
   * Calculate improvement trend
   * @param {Array} improvements - Improvement data
   * @returns {Array} Improvement trend data
   */
  calculateImprovementTrend(improvements) {
    const dailyImprovements = {};

    improvements.forEach(improvement => {
      const day = improvement.timestamp.toISOString().split('T')[0];
      if (!dailyImprovements[day]) {
        dailyImprovements[day] = 0;
      }
      dailyImprovements[day]++;
    });

    return Object.entries(dailyImprovements)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7) // Last 7 days
      .map(([date, count]) => ({
        date,
        improvements: count
      }));
  }

  /**
   * Start gap detection background process
   */
  startGapDetection() {
    setInterval(async () => {
      for (const businessId of this.gapAnalysis.keys()) {
        try {
          await this.performGapAnalysis(businessId);
        } catch (error) {
          console.error(`[ContinuousImprovement] Gap analysis error for ${businessId}:`, error);
        }
      }
    }, this.config.gapDetectionInterval);
  }

  /**
   * Start knowledge base updates background process
   */
  startKnowledgeBaseUpdates() {
    setInterval(async () => {
      for (const businessId of this.knowledgeBaseUpdates.keys()) {
        try {
          await this.performKnowledgeBaseUpdate(businessId);
        } catch (error) {
          console.error(`[ContinuousImprovement] Knowledge update error for ${businessId}:`, error);
        }
      }
    }, this.config.knowledgeRefreshInterval);
  }

  /**
   * Start feedback analysis background process
   */
  startFeedbackAnalysis() {
    setInterval(async () => {
      for (const businessId of this.improvementMetrics.keys()) {
        try {
          await this.analyzeFeedbackTrends(businessId);
        } catch (error) {
          console.error(`[ContinuousImprovement] Feedback analysis error for ${businessId}:`, error);
        }
      }
    }, this.config.feedbackAnalysisInterval);
  }

  /**
   * Analyze feedback trends
   * @param {string} businessId - Business ID
   */
  async analyzeFeedbackTrends(businessId) {
    const metrics = this.improvementMetrics.get(businessId);
    if (!metrics) return;

    const recentFeedback = metrics.metrics.userSatisfactionTrend.slice(-20);
    if (recentFeedback.length < 5) return;

    const avgSatisfaction = recentFeedback.reduce((sum, f) => sum + f.satisfaction, 0) / recentFeedback.length;
    const trend = this.calculateSatisfactionTrend(recentFeedback);

    // Store feedback analysis
    if (!this.feedbackLoop.has(businessId)) {
      this.feedbackLoop.set(businessId, []);
    }

    this.feedbackLoop.get(businessId).push({
      timestamp: new Date(),
      averageSatisfaction: avgSatisfaction,
      trend,
      sampleSize: recentFeedback.length
    });
  }

  /**
   * Calculate satisfaction trend
   * @param {Array} feedback - Feedback data
   * @returns {string} Trend direction
   */
  calculateSatisfactionTrend(feedback) {
    if (feedback.length < 2) return 'stable';

    const firstHalf = feedback.slice(0, Math.floor(feedback.length / 2));
    const secondHalf = feedback.slice(Math.floor(feedback.length / 2));

    const firstAvg = firstHalf.reduce((sum, f) => sum + f.satisfaction, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, f) => sum + f.satisfaction, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 0.2) return 'improving';
    if (secondAvg < firstAvg - 0.2) return 'declining';
    return 'stable';
  }

  /**
   * Export improvement data
   * @param {string} businessId - Business ID
   * @param {string} format - Export format
   * @returns {string} Exported data
   */
  exportImprovementData(businessId, format = 'json') {
    const dashboard = this.getImprovementDashboard(businessId);

    switch (format) {
      case 'json':
        return JSON.stringify(dashboard, null, 2);

      case 'csv':
        return this.convertImprovementDataToCSV(dashboard);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert improvement data to CSV
   * @param {Object} dashboard - Dashboard data
   * @returns {string} CSV string
   */
  convertImprovementDataToCSV(dashboard) {
    let csv = 'Metric,Value\n';
    csv += `Total Queries,${dashboard.overview.totalQueries}\n`;
    csv += `Knowledge Gaps,${dashboard.overview.knowledgeGaps}\n`;
    csv += `Improvements Made,${dashboard.overview.improvementsMade}\n`;
    csv += `Average Response Quality,${dashboard.overview.averageResponseQuality}\n`;
    csv += `Gap Percentage,${dashboard.overview.gapPercentage}%\n`;

    return csv;
  }

  /**
   * Get improvement recommendations
   * @param {string} businessId - Business ID
   * @returns {Array} Recommendations
   */
  getImprovementRecommendations(businessId) {
    const dashboard = this.getImprovementDashboard(businessId);
    return dashboard.recommendations;
  }

  /**
   * Reset improvement data for business
   * @param {string} businessId - Business ID
   */
  resetImprovementData(businessId) {
    this.knowledgeBaseUpdates.delete(businessId);
    this.gapAnalysis.delete(businessId);
    this.improvementMetrics.delete(businessId);
    this.feedbackLoop.delete(businessId);
  }
}

module.exports = new ContinuousImprovementService();