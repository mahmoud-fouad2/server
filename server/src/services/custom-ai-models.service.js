const prisma = require('../config/database');
const vectorSearchService = require('./vector-search.service');
const embeddingService = require('./embedding.service');

/**
 * Custom AI Models Service
 * Manages client-specific AI model training and fine-tuning
 */
class CustomAIModelsService {
  constructor() {
    this.models = new Map(); // Cache for loaded models
    this.trainingJobs = new Map(); // Track training progress
  }

  /**
   * Create custom model for a client
   * @param {string} businessId - Business ID
   * @param {Object} config - Model configuration
   * @returns {Promise<Object>} Model creation result
   */
  async createCustomModel(businessId, config = {}) {
    try {
      console.log(`[CustomAI] Creating custom model for business ${businessId}`);

      // Get client's knowledge base for training data
      const knowledgeBase = await prisma.knowledgeBase.findMany({
        where: { businessId },
        include: { knowledgeChunks: true }
      });

      if (knowledgeBase.length === 0) {
        throw new Error('Insufficient knowledge base for custom model training');
      }

      // Prepare training data
      const trainingData = this.prepareTrainingData(knowledgeBase);

      // Create model record
      const model = await prisma.aiModel.create({
        data: {
          name: `custom-${businessId}-${Date.now()}`,
          apiKey: 'custom-model', // Placeholder
          endpoint: 'custom',
          maxTokens: config.maxTokens || 1000,
          isActive: false, // Will be activated after training
          priority: 10, // High priority for custom models
          metadata: {
            businessId,
            trainingDataSize: trainingData.length,
            config,
            status: 'training'
          }
        }
      });

      // Start async training
      this.startModelTraining(model.id, trainingData, config);

      return {
        success: true,
        modelId: model.id,
        status: 'training',
        estimatedTime: '30-60 minutes'
      };

    } catch (error) {
      console.error('[CustomAI] Error creating custom model:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare training data from knowledge base
   * @param {Array} knowledgeBase - Knowledge base entries
   * @returns {Array} Training data
   */
  prepareTrainingData(knowledgeBase) {
    const trainingData = [];

    for (const kb of knowledgeBase) {
      // Create Q&A pairs from content
      const chunks = kb.knowledgeChunks || [];
      for (const chunk of chunks) {
        trainingData.push({
          input: `Answer this question based on the following context: ${chunk.content}`,
          output: chunk.content,
          metadata: {
            businessId: kb.businessId,
            type: 'knowledge'
          }
        });
      }
    }

    return trainingData;
  }

  /**
   * Start model training (async)
   * @param {string} modelId - Model ID
   * @param {Array} trainingData - Training data
   * @param {Object} config - Training config
   */
  async startModelTraining(modelId, trainingData, config) {
    this.trainingJobs.set(modelId, {
      status: 'training',
      progress: 0,
      startTime: Date.now()
    });

    // Simulate training process (in real implementation, this would call actual ML APIs)
    setTimeout(async () => {
      try {
        // Update model status to trained
        await prisma.aiModel.update({
          where: { id: modelId },
          data: {
            isActive: true,
            metadata: {
              ...config,
              status: 'trained',
              trainedAt: new Date().toISOString(),
              trainingDataSize: trainingData.length
            }
          }
        });

        this.trainingJobs.set(modelId, {
          status: 'completed',
          progress: 100,
          completedAt: Date.now()
        });

        console.log(`[CustomAI] Model ${modelId} training completed`);

      } catch (error) {
        console.error(`[CustomAI] Training failed for model ${modelId}:`, error);
        this.trainingJobs.set(modelId, {
          status: 'failed',
          error: error.message
        });
      }
    }, 30000); // 30 seconds for demo
  }

  /**
   * Get custom model for business
   * @param {string} businessId - Business ID
   * @returns {Promise<Object|null>} Custom model or null
   */
  async getCustomModel(businessId) {
    const model = await prisma.aiModel.findFirst({
      where: {
        metadata: {
          path: ['businessId'],
          equals: businessId
        },
        isActive: true
      }
    });

    return model;
  }

  /**
   * Fine-tune existing model with new data
   * @param {string} businessId - Business ID
   * @param {Array} newData - New training data
   * @returns {Promise<Object>} Fine-tuning result
   */
  async fineTuneModel(businessId, newData) {
    const existingModel = await this.getCustomModel(businessId);

    if (!existingModel) {
      return this.createCustomModel(businessId, { fineTune: true });
    }

    // Add new data to existing training data
    const updatedTrainingData = [
      ...JSON.parse(existingModel.metadata?.trainingData || '[]'),
      ...newData
    ];

    return this.startModelTraining(existingModel.id, updatedTrainingData, {
      fineTune: true,
      previousVersion: existingModel.id
    });
  }

  /**
   * Get training status
   * @param {string} modelId - Model ID
   * @returns {Object} Training status
   */
  getTrainingStatus(modelId) {
    return this.trainingJobs.get(modelId) || { status: 'not_found' };
  }

  /**
   * Generate response using custom model
   * @param {string} businessId - Business ID
   * @param {string} message - User message
   * @param {Array} history - Conversation history
   * @returns {Promise<Object>} AI response
   */
  async generateCustomResponse(businessId, message, history = []) {
    const customModel = await this.getCustomModel(businessId);

    if (!customModel) {
      throw new Error('No custom model available for this business');
    }

    // Use vector search to get relevant context
    const relevantChunks = await vectorSearchService.searchKnowledge(businessId, message, 3, 0.7);
    const context = relevantChunks.map(chunk => chunk.content).join('\n\n');

    // Generate response using custom logic (simplified for demo)
    const response = await this.generateResponseWithCustomModel(message, context, history, customModel);

    return {
      response,
      model: customModel.name,
      fromCache: false,
      tokensUsed: Math.floor(response.length / 4), // Rough estimate
      provider: 'custom'
    };
  }

  /**
   * Generate response with custom model (simplified implementation)
   */
  async generateResponseWithCustomModel(message, context, history, model) {
    // In real implementation, this would call the custom model API
    // For demo, we'll use a simple template-based approach

    const prompt = `You are a helpful AI assistant with specialized knowledge.

Context: ${context}

Previous conversation:
${history.map(h => `${h.role}: ${h.content}`).join('\n')}

User: ${message}

Assistant:`;

    // Simulate custom model response
    return `بناءً على معرفتي المتخصصة: ${context.substring(0, 200)}... هل يمكنني مساعدتك في أي تفاصيل إضافية؟`;
  }
}

module.exports = new CustomAIModelsService();