const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const CustomAIModelsService = require('../services/custom-ai-models.service');

/**
 * @route POST /api/ai-models/create
 * @desc Create custom AI model
 * @access Private (Business Owner/Admin)
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, baseModel, trainingData, description } = req.body;
    const businessId = req.business?.id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    if (!name || !baseModel) {
      return res.status(400).json({
        success: false,
        message: 'Model name and base model are required'
      });
    }

    const result = await CustomAIModelsService.createCustomModel(businessId, {
      name,
      baseModel,
      trainingData: trainingData || [],
      description
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Create error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create custom AI model',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai-models
 * @desc Get all custom models for business
 * @access Private (Business Owner/Admin)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const models = await CustomAIModelsService.getCustomModels(businessId);
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Get models error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get custom models',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai-models/:modelId
 * @desc Get custom model details
 * @access Private (Business Owner/Admin)
 */
router.get('/:modelId', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const businessId = req.business?.id;

    const model = await CustomAIModelsService.getCustomModel(modelId, businessId);

    if (!model) {
      return res.status(404).json({
        success: false,
        message: 'Custom model not found'
      });
    }

    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Get model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get custom model',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai-models/:modelId/train
 * @desc Start model training
 * @access Private (Business Owner/Admin)
 */
router.post('/:modelId/train', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { trainingData, hyperparameters } = req.body;
    const businessId = req.business?.id;

    const result = await CustomAIModelsService.startModelTraining(modelId, businessId, {
      trainingData,
      hyperparameters
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Train model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start model training',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai-models/:modelId/status
 * @desc Get training status
 * @access Private (Business Owner/Admin)
 */
router.get('/:modelId/status', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const businessId = req.business?.id;

    const status = await CustomAIModelsService.getTrainingStatus(modelId, businessId);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get training status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai-models/:modelId/fine-tune
 * @desc Fine-tune existing model
 * @access Private (Business Owner/Admin)
 */
router.post('/:modelId/fine-tune', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { additionalData, learningRate, epochs } = req.body;
    const businessId = req.business?.id;

    const result = await CustomAIModelsService.fineTuneModel(modelId, businessId, {
      additionalData,
      learningRate,
      epochs
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Fine-tune error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fine-tune model',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai-models/generate
 * @desc Generate response using custom model
 * @access Private
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { modelId, query, context, maxTokens } = req.body;
    const businessId = req.business?.id;

    if (!modelId || !query) {
      return res.status(400).json({
        success: false,
        message: 'Model ID and query are required'
      });
    }

    const result = await CustomAIModelsService.generateCustomResponse(
      businessId,
      query,
      context || [],
      { maxTokens }
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Generate response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom response',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/ai-models/:modelId
 * @desc Delete custom model
 * @access Private (Business Owner/Admin)
 */
router.delete('/:modelId', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const businessId = req.business?.id;

    const result = await CustomAIModelsService.deleteCustomModel(modelId, businessId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Custom model not found'
      });
    }

    res.json({
      success: true,
      message: 'Custom model deleted successfully'
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Delete model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete custom model',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai-models/templates
 * @desc Get available model templates
 * @access Private (Business Owner/Admin)
 */
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const templates = [
      {
        id: 'customer_support',
        name: 'دعم العملاء',
        description: 'نموذج متخصص في خدمة العملاء والاستفسارات',
        baseModel: 'gpt-3.5-turbo',
        recommendedData: 1000,
        category: 'support'
      },
      {
        id: 'sales_assistant',
        name: 'مساعد المبيعات',
        description: 'نموذج متخصص في المبيعات والتسويق',
        baseModel: 'gpt-4',
        recommendedData: 2000,
        category: 'sales'
      },
      {
        id: 'technical_support',
        name: 'الدعم الفني',
        description: 'نموذج متخصص في حل المشاكل التقنية',
        baseModel: 'gpt-3.5-turbo',
        recommendedData: 1500,
        category: 'technical'
      },
      {
        id: 'general_chat',
        name: 'محادثة عامة',
        description: 'نموذج للمحادثات العامة والأسئلة المتنوعة',
        baseModel: 'gpt-3.5-turbo',
        recommendedData: 500,
        category: 'general'
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get model templates',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai-models/:modelId/data
 * @desc Add training data to model
 * @access Private (Business Owner/Admin)
 */
router.post('/:modelId/data', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { data, dataType } = req.body;
    const businessId = req.business?.id;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Training data array is required'
      });
    }

    const result = await CustomAIModelsService.addTrainingData(modelId, businessId, data, dataType);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Add training data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add training data',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai-models/:modelId/metrics
 * @desc Get model performance metrics
 * @access Private (Business Owner/Admin)
 */
router.get('/:modelId/metrics', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const businessId = req.business?.id;

    const metrics = await CustomAIModelsService.getModelMetrics(modelId, businessId);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Get metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get model metrics',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai-models/:modelId/deploy
 * @desc Deploy model to production
 * @access Private (Business Owner/Admin)
 */
router.post('/:modelId/deploy', authenticateToken, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { environment } = req.body;
    const businessId = req.business?.id;

    const result = await CustomAIModelsService.deployModel(modelId, businessId, environment);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Deploy model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deploy model',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai-models/base-models
 * @desc Get available base models
 * @access Private (Business Owner/Admin)
 */
router.get('/base-models', authenticateToken, async (req, res) => {
  try {
    const baseModels = [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        maxTokens: 4096,
        costPerToken: 0.002,
        capabilities: ['text-generation', 'conversation', 'analysis']
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        maxTokens: 8192,
        costPerToken: 0.03,
        capabilities: ['text-generation', 'conversation', 'analysis', 'code']
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        maxTokens: 200000,
        costPerToken: 0.015,
        capabilities: ['text-generation', 'conversation', 'analysis', 'long-context']
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google',
        maxTokens: 32768,
        costPerToken: 0.001,
        capabilities: ['text-generation', 'conversation', 'multimodal']
      }
    ];

    res.json({
      success: true,
      data: baseModels
    });
  } catch (error) {
    console.error('[Custom AI Models Routes] Get base models error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get base models',
      error: error.message
    });
  }
});

module.exports = router;
