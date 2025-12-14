/**
 * Faheemly™ - Admin Extended Routes
 * Copyright © 2024-2025 Faheemly.com - All Rights Reserved
 * 
 * PROPRIETARY SOFTWARE - Unauthorized copying or distribution is prohibited.
 * 
 * Admin routes for user management and system control panel.
 * Requires SUPERADMIN role for all endpoints.
 * 
 * @module routes/admin-extended
 */

const express = require('express');
const router = express.Router();

// Controllers
const adminUsersController = require('../controllers/admin-users.controller');
const systemController = require('../controllers/system.controller');
const adminIntegrationsController = require('../controllers/admin-integrations.controller');
const adminAnalyticsController = require('../controllers/admin-analytics.controller');
const adminMediaController = require('../controllers/admin-media.controller');

// Middleware
const { authenticateToken } = require('../middleware/auth');
// Use unified authorization middleware (replace deprecated permission wrapper)
const { requirePermission } = require('../middleware/authorization');

// ============================================
// 🔐 AUTHENTICATION REQUIRED FOR ALL ROUTES
// ============================================
router.use(authenticateToken);

// ============================================
// 👥 USER MANAGEMENT ROUTES
// ============================================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (paginated, searchable, filterable)
 * @access  SUPERADMIN
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20, max: 100)
 * @query   {string} search - Search term (email, name)
 * @query   {string} role - Filter by role (USER, ADMIN, SUPERADMIN)
 * @query   {boolean} active - Filter by active status
 * @query   {string} sortBy - Sort field (default: 'createdAt')
 * @query   {string} sortOrder - Sort order (asc/desc, default: 'desc')
 */
router.get(
  '/users',
  requirePermission('users:read'),
  adminUsersController.getAllUsers
);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID with full details
 * @access  SUPERADMIN
 */
router.get(
  '/users/:id',
  requirePermission('users:read'),
  adminUsersController.getUserById
);

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 * @access  SUPERADMIN
 * @body    {string} email - User email (required, unique)
 * @body    {string} password - User password (required, min 8 chars)
 * @body    {string} name - User name (required)
 * @body    {string} role - User role (USER, ADMIN, SUPERADMIN)
 * @body    {boolean} isActive - Account status (default: true)
 */
router.post(
  '/users',
  requirePermission('users:create'),
  adminUsersController.createUser
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user details
 * @access  SUPERADMIN
 * @body    {string} email - User email
 * @body    {string} name - User name
 * @body    {string} role - User role
 * @body    {boolean} isActive - Account status
 */
router.put(
  '/users/:id',
  requirePermission('users:update'),
  adminUsersController.updateUser
);

/**
 * @route   PUT /api/admin/users/:id/password
 * @desc    Change user password (admin-initiated)
 * @access  SUPERADMIN
 * @body    {string} newPassword - New password (required, min 8 chars)
 */
router.put(
  '/users/:id/password',
  requirePermission('users:update'),
  adminUsersController.changeUserPassword
);

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Toggle user active status (activate/deactivate)
 * @access  SUPERADMIN
 * @body    {boolean} isActive - New status
 */
router.patch(
  '/users/:id/status',
  requirePermission('users:update'),
  adminUsersController.toggleUserStatus
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Soft delete user (30-day restore window)
 * @access  SUPERADMIN
 * @body    {string} reason - Deletion reason (required)
 */
router.delete(
  '/users/:id',
  requirePermission('users:delete'),
  adminUsersController.deleteUser
);

/**
 * @route   DELETE /api/admin/users/:id/permanent
 * @desc    Permanently delete user (cannot be restored)
 * @access  SUPERADMIN
 * @body    {string} confirmation - Must be "PERMANENTLY_DELETE"
 */
router.delete(
  '/users/:id/permanent',
  requirePermission('users:delete'),
  adminUsersController.hardDeleteUser
);

/**
 * @route   POST /api/admin/users/:id/restore
 * @desc    Restore soft-deleted user
 * @access  SUPERADMIN
 */
router.post(
  '/users/:id/restore',
  requirePermission('users:update'),
  adminUsersController.restoreUser
);

/**
 * @route   GET /api/admin/users/:id/audit-log
 * @desc    Get user audit log (paginated)
 * @access  SUPERADMIN
 * @query   {number} page - Page number
 * @query   {number} limit - Items per page
 */
router.get(
  '/users/:id/audit-log',
  requirePermission('users:read'),
  adminUsersController.getUserAuditLog
);

/**
 * @route   GET /api/admin/users/:id/export
 * @desc    Export user data (GDPR compliance)
 * @access  SUPERADMIN
 */
router.get(
  '/users/:id/export',
  requirePermission('users:read'),
  adminUsersController.exportUserData
);

// ============================================
// 🤖 AI PROVIDERS ROUTES
// ============================================

/**
 * @route   GET /api/admin/system/ai-providers
 * @desc    Get all AI provider configurations
 * @access  SUPERADMIN
 */
router.get(
  '/system/ai-providers',
  requirePermission('system:read'),
  systemController.getAiProviders
);

/**
 * @route   PUT /api/admin/system/ai-providers/:id
 * @desc    Update AI provider configuration
 * @access  SUPERADMIN
 * @body    {string} apiKey - API key (optional, encrypted if provided)
 * @body    {object} modelConfig - Model configuration
 * @body    {boolean} isActive - Provider status
 */
router.put(
  '/system/ai-providers/:id',
  requirePermission('system:update'),
  systemController.updateAiProvider
);

/**
 * @route   POST /api/admin/system/ai-providers/:id/test
 * @desc    Test AI provider health
 * @access  SUPERADMIN
 */
router.post(
  '/system/ai-providers/:id/test',
  requirePermission('system:read'),
  systemController.testAiProvider
);

// ============================================
// 📝 SYSTEM PROMPTS ROUTES
// ============================================

/**
 * @route   GET /api/admin/system/prompts
 * @desc    Get all system prompts (versioned)
 * @access  SUPERADMIN
 * @query   {string} type - Filter by type (system, business, etc.)
 * @query   {boolean} activeOnly - Show only active versions
 */
router.get(
  '/system/prompts',
  requirePermission('system:read'),
  systemController.getSystemPrompts
);

// ============================================
// 🖼️ MEDIA MANAGEMENT (ADMIN)
// ============================================
router.get(
  '/media',
  requirePermission('media:read'),
  adminMediaController.getMediaList
);

router.delete(
  '/media',
  requirePermission('media:delete'),
  adminMediaController.deleteMedia
);

/**
 * @route   POST /api/admin/system/prompts
 * @desc    Create new system prompt version
 * @access  SUPERADMIN
 * @body    {string} name - Prompt name
 * @body    {string} type - Prompt type
 * @body    {string} content - Prompt content
 * @body    {string} version - Version number
 */
router.post(
  '/system/prompts',
  requirePermission('system:update'),
  systemController.createSystemPrompt
);

/**
 * @route   PUT /api/admin/system/prompts/:id
 * @desc    Update system prompt (creates new version)
 * @access  SUPERADMIN
 */
router.put(
  '/system/prompts/:id',
  requirePermission('system:update'),
  systemController.updateSystemPrompt
);

/**
 * @route   POST /api/admin/system/prompts/:id/rollback
 * @desc    Rollback to previous prompt version
 * @access  SUPERADMIN
 * @body    {string} versionId - Target version ID
 */
router.post(
  '/system/prompts/:id/rollback',
  requirePermission('system:update'),
  systemController.rollbackSystemPrompt
);

// ============================================
// 🔧 API CONFIGURATION ROUTES
// ============================================

/**
 * @route   GET /api/admin/integrations
 * @desc    Get available integrations and their status
 * @access  SUPERADMIN
 */
router.get(
  '/integrations',
  requirePermission('integrations:read'),
  adminIntegrationsController.getIntegrations
);

/**
 * @route   GET /api/admin/integrations/:type?businessId=xxx
 * @desc    Get integration config for a business
 * @access  SUPERADMIN
 */
router.get(
  '/integrations/:type',
  requirePermission('integrations:read'),
  adminIntegrationsController.getIntegrationForBusiness
);

/**
 * @route   PUT /api/admin/integrations/:type
 * @desc    Upsert integration config for a business
 * @access  SUPERADMIN
 */
router.put(
  '/integrations/:type',
  requirePermission('integrations:update'),
  adminIntegrationsController.upsertIntegration
);

/**
 * @route   POST /api/admin/integrations/:type/test
 * @desc    Test integration credentials/config without persisting
 * @access  SUPERADMIN
 */
router.post(
  '/integrations/:type/test',
  requirePermission('integrations:read'),
  adminIntegrationsController.testIntegration
);

/**
 * @route   GET /api/admin/system/api-config
 * @desc    Get all API endpoint configurations
 * @access  SUPERADMIN
 */
router.get(
  '/system/api-config',
  requirePermission('system:read'),
  systemController.getApiConfiguration
);

/**
 * @route   PUT /api/admin/system/api-config/:id
 * @desc    Update API endpoint configuration
 * @access  SUPERADMIN
 * @body    {string} endpoint - Endpoint path
 * @body    {object} rateLimit - Rate limit config
 * @body    {boolean} isEnabled - Endpoint status
 */
router.put(
  '/system/api-config/:id',
  requirePermission('system:update'),
  systemController.updateApiConfiguration
);

// ============================================
// 🚩 FEATURE FLAGS ROUTES
// ============================================

/**
 * @route   GET /api/admin/system/feature-flags
 * @desc    Get all feature flags
 * @access  SUPERADMIN
 */
router.get(
  '/system/feature-flags',
  requirePermission('system:read'),
  systemController.getFeatureFlags
);

/**
 * @route GET /api/admin/analytics/overview
 * @desc  Global analytics overview (SUPERADMIN)
 */
router.get(
  '/analytics/overview',
  requirePermission('analytics:read'),
  adminAnalyticsController.getOverview
);

/**
 * @route GET /api/admin/analytics/by-country
 * @desc  Sessions grouped by country
 */
router.get(
  '/analytics/by-country',
  requirePermission('analytics:read'),
  adminAnalyticsController.getSessionsByCountry
);

router.get(
  '/analytics/top-ips',
  requirePermission('analytics:read'),
  adminAnalyticsController.getTopIps
);

router.get(
  '/analytics/breakdown',
  requirePermission('analytics:read'),
  adminAnalyticsController.getBrowserDeviceBreakdown
);

router.get(
  '/analytics/referrers',
  requirePermission('analytics:read'),
  adminAnalyticsController.getReferrers
);

/**
 * @route   POST /api/admin/system/feature-flags
 * @desc    Create or update feature flag
 * @access  SUPERADMIN
 * @body    {string} name - Feature flag name
 * @body    {boolean} isEnabled - Flag status
 * @body    {number} rolloutPercentage - Gradual rollout (0-100)
 * @body    {array} targetUsers - Specific user IDs
 */
router.post(
  '/system/feature-flags',
  requirePermission('system:update'),
  systemController.upsertFeatureFlag
);

/**
 * @route   PATCH /api/admin/system/feature-flags/:name/toggle
 * @desc    Toggle feature flag on/off
 * @access  SUPERADMIN
 */
router.patch(
  '/system/feature-flags/:name/toggle',
  requirePermission('system:update'),
  systemController.toggleFeatureFlag
);

// ============================================
// ⚙️ SYSTEM SETTINGS ROUTES
// ============================================

/**
 * @route   GET /api/admin/system/settings
 * @desc    Get all system settings
 * @access  SUPERADMIN
 */
router.get(
  '/system/settings',
  requirePermission('system:read'),
  systemController.getSystemSettings
);

/**
 * @route   PUT /api/admin/system/settings/:key
 * @desc    Update system setting (versioned)
 * @access  SUPERADMIN
 * @body    {any} value - Setting value (type depends on setting)
 */
router.put(
  '/system/settings/:key',
  requirePermission('system:update'),
  systemController.updateSystemSetting
);

// ============================================
// 📊 HEALTH MONITORING ROUTES
// ============================================

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health metrics
 * @access  SUPERADMIN
 * @query   {string} timeRange - Time range (1h, 24h, 7d, 30d)
 */
router.get(
  '/system/health',
  requirePermission('system:read'),
  systemController.getSystemHealth
);

/**
 * @route   POST /api/admin/system/health/metric
 * @desc    Record custom health metric
 * @access  SUPERADMIN (automated systems)
 * @body    {string} metricName - Metric name
 * @body    {number} value - Metric value
 * @body    {string} unit - Metric unit
 */
router.post(
  '/system/health/metric',
  requirePermission('system:update'),
  systemController.recordHealthMetric
);

// ============================================
// 📦 VERSION MANAGEMENT ROUTES
// ============================================

/**
 * @route   GET /api/admin/system/versions
 * @desc    Get system version history
 * @access  SUPERADMIN
 */
router.get(
  '/system/versions',
  requirePermission('system:read'),
  systemController.getSystemVersions
);

/**
 * @route   POST /api/admin/system/versions
 * @desc    Create new system version record
 * @access  SUPERADMIN (automated deployment)
 * @body    {string} version - Version number (e.g., "2.0.0")
 * @body    {string} description - Version description
 * @body    {array} changes - List of changes
 * @body    {object} migrationSteps - Database migration info
 */
router.post(
  '/system/versions',
  requirePermission('system:update'),
  systemController.createSystemVersion
);

// ============================================
// 🛡️ IP PROTECTION ROUTES
// ============================================

/**
 * @route   GET /api/admin/system/ip-status
 * @desc    Get IP protection status
 * @access  SUPERADMIN
 */
router.get(
  '/system/ip-status',
  requirePermission('system:read'),
  async (req, res) => {
    try {
      const ipProtection = require('../utils/ip-protection');
      const integrityCheck = await ipProtection.verifySaasIntegrity();
      const fingerprint = ipProtection.getFaheemlyFingerprint();
      const copyright = ipProtection.getCopyrightNotice();
      
      res.json({
        success: true,
        data: {
          integrity: integrityCheck,
          fingerprint,
          copyright,
          aiProtection: ipProtection.getAiReadableMetadata()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to check IP protection status'
      });
    }
  }
);

// ============================================
// 📋 AUDIT LOG ROUTES
// ============================================

/**
 * @route   GET /api/admin/system/audit-log
 * @desc    Get system-wide audit log
 * @access  SUPERADMIN
 * @query   {number} page - Page number
 * @query   {number} limit - Items per page
 * @query   {string} action - Filter by action type
 * @query   {string} userId - Filter by user ID
 * @query   {string} startDate - Filter from date
 * @query   {string} endDate - Filter to date
 */
router.get(
  '/system/audit-log',
  requirePermission('system:read'),
  async (req, res) => {
    try {
      const prisma = require('../config/database');
      const { page = 1, limit = 50, action, userId, startDate, endDate } = req.query;
      
      const where = {};
      if (action) where.action = action;
      if (userId) where.userId = userId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }
      
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: parseInt(limit)
        }),
        prisma.auditLog.count({ where })
      ]);
      
      res.json({
        success: true,
        data: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit log'
      });
    }
  }
);

// ============================================
// 📊 STATISTICS ROUTES
// ============================================

/**
 * @route   GET /api/admin/system/stats
 * @desc    Get system statistics
 * @access  SUPERADMIN
 */
router.get(
  '/system/stats',
  requirePermission('system:read'),
  async (req, res) => {
    try {
      const prisma = require('../config/database');
      
      const [
        totalUsers,
        activeUsers,
        totalBusinesses,
        totalConversations,
        todayMessages
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.business.count(),
        prisma.conversation.count(),
        prisma.message.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ]);
      
      res.json({
        success: true,
        data: {
          users: { total: totalUsers, active: activeUsers },
          businesses: totalBusinesses,
          conversations: totalConversations,
          messages: { today: todayMessages }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }
);

// ============================================
// ERROR HANDLER
// ============================================

// 404 handler for undefined routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Admin endpoint not found',
    path: req.path
  });
});

module.exports = router;
