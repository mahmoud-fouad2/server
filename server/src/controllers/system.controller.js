/**
 * System Control Panel Controller
 * Manage AI providers, system prompts, API configuration, feature flags
 * 
 * @requires express-async-handler
 * @requires prisma
 */

const asyncHandler = require('express-async-handler');
const prisma = require('../config/database');
const logger = require('../utils/logger');

// ==========================================
// AI PROVIDERS MANAGEMENT
// ==========================================

/**
 * @desc    Get all AI providers configuration
 * @route   GET /api/admin/system/ai-providers
 * @access  Private (SUPERADMIN only)
 */
exports.getAiProviders = asyncHandler(async (req, res) => {
  const providers = await prisma.aiProviderConfig.findMany({
    orderBy: [
      { enabled: 'desc' },
      { priority: 'desc' }
    ],
    select: {
      id: true,
      provider: true,
      enabled: true,
      priority: true,
      model: true,
      rateLimit: true,
      maxTokens: true,
      temperature: true,
      lastHealth: true,
      healthStatus: true,
      errorCount: true,
      updatedAt: true
      // apiKey intentionally excluded for security
    }
  });

  res.json({ providers });
});

/**
 * @desc    Update AI provider configuration
 * @route   PUT /api/admin/system/ai-providers/:provider
 * @access  Private (SUPERADMIN only)
 */
exports.updateAiProvider = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const { enabled, priority, model, rateLimit, maxTokens, temperature } = req.body;

  const updateData = {};
  if (enabled !== undefined) updateData.enabled = enabled;
  if (priority !== undefined) updateData.priority = priority;
  if (model !== undefined) updateData.model = model;
  if (rateLimit !== undefined) updateData.rateLimit = rateLimit;
  if (maxTokens !== undefined) updateData.maxTokens = maxTokens;
  if (temperature !== undefined) updateData.temperature = temperature;

  const updatedProvider = await prisma.aiProviderConfig.upsert({
    where: { provider },
    create: {
      provider,
      ...updateData
    },
    update: updateData
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'AiProviderConfig',
      entityId: updatedProvider.id,
      changes: { after: updateData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.info(`Admin ${req.user.email} updated AI provider ${provider}`, updateData);

  res.json({
    message: 'AI provider updated successfully',
    provider: updatedProvider
  });
});

/**
 * @desc    Test AI provider health
 * @route   POST /api/admin/system/ai-providers/:provider/test
 * @access  Private (SUPERADMIN only)
 */
exports.testAiProvider = asyncHandler(async (req, res) => {
  const { provider } = req.params;

  const providerConfig = await prisma.aiProviderConfig.findUnique({
    where: { provider }
  });

  if (!providerConfig) {
    res.status(404);
    throw new Error('Provider not found');
  }

  // Test the provider (implement actual test based on your aiService)
  const aiService = require('../services/ai.service');
  const testMessage = "Hello, this is a test message.";

  try {
    const startTime = Date.now();
    const messages = [
      { role: 'system', content: 'You are the official Faheemly assistant. Keep replies concise.' },
      { role: 'user', content: testMessage }
    ];

    const response = await aiService.generateResponseWithProvider(
      provider,
      messages,
      { maxTokens: 120 }
    );
    const latency = Date.now() - startTime;

    // Update health status
    await prisma.aiProviderConfig.update({
      where: { provider },
      data: {
        lastHealth: new Date(),
        healthStatus: 'HEALTHY',
        errorCount: 0
      }
    });

    const responseValidator = require('../services/response-validator.service');
    const sanitized = responseValidator.sanitizeResponse(response.response || '');
    res.json({
      success: true,
      provider,
      latency: `${latency}ms`,
      response: sanitized.substring(0, 100) + '...'
    });
  } catch (error) {
    // Update error status
    await prisma.aiProviderConfig.update({
      where: { provider },
      data: {
        lastHealth: new Date(),
        healthStatus: 'DOWN',
        errorCount: providerConfig.errorCount + 1
      }
    });

    logger.error(`AI provider ${provider} test failed`, error);

    res.status(500).json({
      success: false,
      provider,
      error: error.message
    });
  }
});

// ==========================================
// SYSTEM PROMPTS MANAGEMENT
// ==========================================

/**
 * @desc    Get all system prompts
 * @route   GET /api/admin/system/prompts
 * @access  Private (SUPERADMIN only)
 */
exports.getSystemPrompts = asyncHandler(async (req, res) => {
  const { category, active } = req.query;

  const where = {};
  if (category) where.category = category;
  if (active !== undefined) where.active = active === 'true';

  const prompts = await prisma.systemPrompt.findMany({
    where,
    orderBy: [
      { category: 'asc' },
      { version: 'desc' }
    ]
  });

  res.json({ prompts });
});

/**
 * @desc    Update generic system settings (compatibility endpoint)
 * @route   POST /api/admin/system-settings
 * @access  Private (SUPERADMIN only)
 */
exports.updateSystemSettings = asyncHandler(async (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, error: 'Key is required' });
  }

  const upserted = await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: String(value || '') },
    update: { value: String(value || '') }
  });

  res.json({ success: true, setting: upserted });
});

/**
 * @desc    Create new system prompt version
 * @route   POST /api/admin/system/prompts
 * @access  Private (SUPERADMIN only)
 */
exports.createSystemPrompt = asyncHandler(async (req, res) => {
  const { name, category, content, description, variables } = req.body;

  if (!name || !category || !content) {
    res.status(400);
    throw new Error('Name, category, and content are required');
  }

  // Get latest version for this prompt name
  const latestPrompt = await prisma.systemPrompt.findFirst({
    where: { name },
    orderBy: { version: 'desc' }
  });

  const newVersion = latestPrompt ? latestPrompt.version + 1 : 1;

  // Deactivate previous version
  if (latestPrompt) {
    await prisma.systemPrompt.updateMany({
      where: { name, active: true },
      data: { active: false }
    });
  }

  // Create new version
  const prompt = await prisma.systemPrompt.create({
    data: {
      name,
      category,
      content,
      description,
      variables: variables || [],
      version: newVersion,
      active: true,
      createdBy: req.user.id
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'CREATE',
      entity: 'SystemPrompt',
      entityId: prompt.id,
      changes: {
        after: { name, category, version: newVersion }
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.info(`Admin ${req.user.email} created system prompt ${name} v${newVersion}`);

  res.status(201).json({
    message: 'System prompt created successfully',
    prompt
  });
});

/**
 * @desc    Update system prompt (creates new version)
 * @route   PUT /api/admin/system/prompts/:id
 * @access  Private (SUPERADMIN only)
 */
exports.updateSystemPrompt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, description, active } = req.body;

  const currentPrompt = await prisma.systemPrompt.findUnique({
    where: { id }
  });

  if (!currentPrompt) {
    res.status(404);
    throw new Error('System prompt not found');
  }

  // If content changed, create new version
  if (content && content !== currentPrompt.content) {
    // Deactivate current version
    await prisma.systemPrompt.update({
      where: { id },
      data: { active: false }
    });

    // Create new version
    const newPrompt = await prisma.systemPrompt.create({
      data: {
        name: currentPrompt.name,
        category: currentPrompt.category,
        content,
        description: description || currentPrompt.description,
        variables: currentPrompt.variables,
        version: currentPrompt.version + 1,
        active: true,
        createdBy: req.user.id
      }
    });

    logger.info(`Admin ${req.user.email} created new version of prompt ${currentPrompt.name}`);

    res.json({
      message: 'New prompt version created',
      prompt: newPrompt
    });
  } else {
    // Just update metadata
    const updatedPrompt = await prisma.systemPrompt.update({
      where: { id },
      data: {
        ...(description !== undefined && { description }),
        ...(active !== undefined && { active })
      }
    });

    res.json({
      message: 'Prompt updated successfully',
      prompt: updatedPrompt
    });
  }
});

/**
 * @desc    Rollback to previous prompt version
 * @route   POST /api/admin/system/prompts/:name/rollback
 * @access  Private (SUPERADMIN only)
 */
exports.rollbackSystemPrompt = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { version } = req.body;

  // Find target version
  const targetPrompt = await prisma.systemPrompt.findUnique({
    where: {
      name_version: {
        name,
        version: parseInt(version)
      }
    }
  });

  if (!targetPrompt) {
    res.status(404);
    throw new Error('Prompt version not found');
  }

  // Deactivate all versions
  await prisma.systemPrompt.updateMany({
    where: { name },
    data: { active: false }
  });

  // Activate target version
  const activatedPrompt = await prisma.systemPrompt.update({
    where: { id: targetPrompt.id },
    data: { active: true }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'ROLLBACK',
      entity: 'SystemPrompt',
      entityId: targetPrompt.id,
      changes: {
        action: 'rollback',
        name,
        toVersion: version
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.warn(`Admin ${req.user.email} rolled back prompt ${name} to v${version}`);

  res.json({
    message: 'Prompt rolled back successfully',
    prompt: activatedPrompt
  });
});

// ==========================================
// API CONFIGURATION MANAGEMENT
// ==========================================

/**
 * @desc    Get all API endpoints configuration
 * @route   GET /api/admin/system/api-config
 * @access  Private (SUPERADMIN only)
 */
exports.getApiConfiguration = asyncHandler(async (req, res) => {
  const configs = await prisma.apiConfiguration.findMany({
    orderBy: { endpoint: 'asc' }
  });

  res.json({ configs });
});

/**
 * @desc    Update API endpoint configuration
 * @route   PUT /api/admin/system/api-config/:endpoint
 * @access  Private (SUPERADMIN only)
 */
exports.updateApiConfiguration = asyncHandler(async (req, res) => {
  const { endpoint } = req.params;
  const { enabled, rateLimit, requireAuth, allowedRoles, corsOrigins, deprecated } = req.body;

  const updateData = {};
  if (enabled !== undefined) updateData.enabled = enabled;
  if (rateLimit !== undefined) updateData.rateLimit = rateLimit;
  if (requireAuth !== undefined) updateData.requireAuth = requireAuth;
  if (allowedRoles !== undefined) updateData.allowedRoles = allowedRoles;
  if (corsOrigins !== undefined) updateData.corsOrigins = corsOrigins;
  if (deprecated !== undefined) updateData.deprecated = deprecated;

  const config = await prisma.apiConfiguration.upsert({
    where: { endpoint },
    create: {
      endpoint,
      method: 'POST', // Default
      ...updateData
    },
    update: updateData
  });

  logger.info(`Admin ${req.user.email} updated API config for ${endpoint}`, updateData);

  res.json({
    message: 'API configuration updated',
    config
  });
});

// ==========================================
// FEATURE FLAGS MANAGEMENT
// ==========================================

/**
 * @desc    Get all feature flags
 * @route   GET /api/admin/system/feature-flags
 * @access  Private (SUPERADMIN only)
 */
exports.getFeatureFlags = asyncHandler(async (req, res) => {
  const flags = await prisma.featureFlag.findMany({
    orderBy: { name: 'asc' }
  });

  res.json({ flags });
});

/**
 * @desc    Create or update feature flag
 * @route   PUT /api/admin/system/feature-flags/:name
 * @access  Private (SUPERADMIN only)
 */
exports.upsertFeatureFlag = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { description, enabled, rollout, businesses, roles, metadata } = req.body;

  const flagData = {
    name,
    ...(description !== undefined && { description }),
    ...(enabled !== undefined && { enabled }),
    ...(rollout !== undefined && { rollout }),
    ...(businesses !== undefined && { businesses }),
    ...(roles !== undefined && { roles }),
    ...(metadata !== undefined && { metadata })
  };

  const flag = await prisma.featureFlag.upsert({
    where: { name },
    create: flagData,
    update: flagData
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'UPSERT',
      entity: 'FeatureFlag',
      entityId: flag.id,
      changes: { after: flagData },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.info(`Admin ${req.user.email} updated feature flag ${name}`);

  res.json({
    message: 'Feature flag updated',
    flag
  });
});

/**
 * @desc    Toggle feature flag
 * @route   POST /api/admin/system/feature-flags/:name/toggle
 * @access  Private (SUPERADMIN only)
 */
exports.toggleFeatureFlag = asyncHandler(async (req, res) => {
  const { name } = req.params;

  const currentFlag = await prisma.featureFlag.findUnique({
    where: { name }
  });

  if (!currentFlag) {
    res.status(404);
    throw new Error('Feature flag not found');
  }

  const updatedFlag = await prisma.featureFlag.update({
    where: { name },
    data: { enabled: !currentFlag.enabled }
  });

  logger.info(`Admin ${req.user.email} toggled feature flag ${name} to ${updatedFlag.enabled}`);

  res.json({
    message: `Feature flag ${updatedFlag.enabled ? 'enabled' : 'disabled'}`,
    flag: updatedFlag
  });
});

// ==========================================
// SYSTEM SETTINGS MANAGEMENT
// ==========================================

/**
 * @desc    Get all system settings
 * @route   GET /api/admin/system/settings
 * @access  Private (SUPERADMIN only)
 */
exports.getSystemSettings = asyncHandler(async (req, res) => {
  const settings = await prisma.systemSetting.findMany();

  // Convert to object
  const settingsObj = settings.reduce((acc, curr) => {
    acc[curr.key] = {
      value: curr.value,
      description: curr.description,
      version: curr.version,
      updatedBy: curr.updatedBy,
      updatedAt: curr.updatedAt
    };
    return acc;
  }, {});

  res.json({ settings: settingsObj });
});

/**
 * @desc    Update system setting
 * @route   PUT /api/admin/system/settings/:key
 * @access  Private (SUPERADMIN only)
 */
exports.updateSystemSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, description } = req.body;

  const currentSetting = await prisma.systemSetting.findUnique({
    where: { key }
  });

  const setting = await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value: String(value),
      description,
      version: 1,
      updatedBy: req.user.id
    },
    update: {
      value: String(value),
      ...(description !== undefined && { description }),
      version: currentSetting ? currentSetting.version + 1 : 1,
      updatedBy: req.user.id
    }
  });

  // Create audit log
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: 'UPDATE',
        entity: 'SystemSetting',
        entityId: key,
        changes: {
          before: currentSetting ? { value: currentSetting.value } : null,
          after: { value }
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
  } catch (err) {
    // Audit logging should not block the setting update; warn and continue
    logger.warn('updateSystemSetting: failed to create audit log', { error: err?.message || err });
  }

  logger.info(`Admin ${req.user.email} updated system setting ${key}`, { value });

  res.json({
    message: 'System setting updated',
    setting
  });
});

// ==========================================
// SYSTEM HEALTH & MONITORING
// ==========================================

/**
 * @desc    Get system health metrics
 * @route   GET /api/admin/system/health
 * @access  Private (SUPERADMIN only)
 */
exports.getSystemHealth = asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const metrics = await prisma.healthMetric.findMany({
    where: {
      timestamp: { gte: since }
    },
    orderBy: { timestamp: 'desc' }
  });

  // Group by metric name
  const grouped = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric);
    return acc;
  }, {});

  res.json({ metrics: grouped });
});

/**
 * @desc    Record system health metric
 * @route   POST /api/admin/system/health
 * @access  Private (SUPERADMIN only)
 */
exports.recordHealthMetric = asyncHandler(async (req, res) => {
  const { name, value, unit, category, severity, metadata } = req.body;

  const metric = await prisma.healthMetric.create({
    data: {
      name,
      value,
      unit,
      category,
      severity: severity || 'INFO',
      metadata
    }
  });

  res.json({ metric });
});

// ==========================================
// SYSTEM VERSIONING
// ==========================================

/**
 * @desc    Get all system versions
 * @route   GET /api/admin/system/versions
 * @access  Private (SUPERADMIN only)
 */
exports.getSystemVersions = asyncHandler(async (req, res) => {
  const versions = await prisma.systemVersion.findMany({
    orderBy: { releaseDate: 'desc' }
  });

  res.json({ versions });
});

/**
 * @desc    Create new system version
 * @route   POST /api/admin/system/versions
 * @access  Private (SUPERADMIN only)
 */
exports.createSystemVersion = asyncHandler(async (req, res) => {
  const { version, changelog, migrations } = req.body;

  const newVersion = await prisma.systemVersion.create({
    data: {
      version,
      releaseDate: new Date(),
      changelog,
      migrations: migrations || [],
      createdBy: req.user.id
    }
  });

  logger.info(`Admin ${req.user.email} created system version ${version}`);

  res.status(201).json({
    message: 'System version created',
    version: newVersion
  });
});

// Export all controller functions
module.exports = {
  // AI Providers
  getAiProviders: exports.getAiProviders,
  updateAiProvider: exports.updateAiProvider,
  testAiProvider: exports.testAiProvider,
  
  // System Prompts
  getSystemPrompts: exports.getSystemPrompts,
  createSystemPrompt: exports.createSystemPrompt,
  updateSystemPrompt: exports.updateSystemPrompt,
  rollbackSystemPrompt: exports.rollbackSystemPrompt,
  
  // API Configuration
  getApiConfiguration: exports.getApiConfiguration,
  updateApiConfiguration: exports.updateApiConfiguration,
  
  // Feature Flags
  getFeatureFlags: exports.getFeatureFlags,
  upsertFeatureFlag: exports.upsertFeatureFlag,
  toggleFeatureFlag: exports.toggleFeatureFlag,
  
  // System Settings
  getSystemSettings: exports.getSystemSettings,
  updateSystemSetting: exports.updateSystemSetting,
  updateSystemSettings: exports.updateSystemSettings,
  
  // Health Monitoring
  getSystemHealth: exports.getSystemHealth,
  recordHealthMetric: exports.recordHealthMetric,
  
  // System Versions
  getSystemVersions: exports.getSystemVersions,
  createSystemVersion: exports.createSystemVersion
};
