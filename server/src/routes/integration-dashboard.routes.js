const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const IntegrationDashboardService = require('../services/integration-dashboard.service');
const logger = require('../utils/logger');

/**
 * @route GET /api/dashboard/integrations
 * @desc Get integration dashboard
 * @access Private (Business Owner/Admin)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user?.businessId || req.business?.id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const dashboard = await IntegrationDashboardService.generateDashboard(businessId);
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    logger.error('[Integration Dashboard Routes] Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get integration dashboard',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/dashboard/integrations/config
 * @desc Update dashboard configuration
 * @access Private (Business Owner/Admin)
 */
router.put('/config', authenticateToken, async (req, res) => {
  try {
    const config = req.body;

    const result = IntegrationDashboardService.updateDashboardConfig(config);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Integration Dashboard Routes] Update config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update dashboard configuration',
      error: error.message
    });
  }
});

/**
 * @route POST /api/dashboard/integrations/custom
 * @desc Add custom integration to dashboard
 * @access Private (Business Owner/Admin)
 */
router.post('/custom', authenticateToken, async (req, res) => {
  try {
    const integration = req.body;

    if (!integration.id || !integration.name) {
      return res.status(400).json({
        success: false,
        message: 'Integration ID and name are required'
      });
    }

    const result = IntegrationDashboardService.addCustomIntegration(integration);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Integration Dashboard Routes] Add custom integration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add custom integration',
      error: error.message
    });
  }
});

/**
 * @route GET /api/dashboard/integrations/export
 * @desc Export dashboard data
 * @access Private (Business Owner/Admin)
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const format = req.query.format || 'json';

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const exportData = await IntegrationDashboardService.exportDashboard(businessId, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=dashboard_${businessId}_${Date.now()}.csv`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=dashboard_${businessId}_${Date.now()}.json`);
    }

    res.send(exportData);
  } catch (error) {
    logger.error('[Integration Dashboard Routes] Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export dashboard data',
      error: error.message
    });
  }
});

/**
 * @route GET /api/dashboard/integrations/themes
 * @desc Get available dashboard themes
 * @access Private (Business Owner/Admin)
 */
router.get('/themes', authenticateToken, async (req, res) => {
  try {
    const themes = IntegrationDashboardService.getAvailableThemes();
    res.json({
      success: true,
      data: themes
    });
  } catch (error) {
    logger.error('[Integration Dashboard Routes] Get themes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard themes',
      error: error.message
    });
  }
});

/**
 * @route POST /api/dashboard/integrations/validate-config
 * @desc Validate dashboard configuration
 * @access Private (Business Owner/Admin)
 */
router.post('/validate-config', authenticateToken, async (req, res) => {
  try {
    const config = req.body;

    const result = IntegrationDashboardService.validateDashboardConfig(config);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Integration Dashboard Routes] Validate config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate dashboard configuration',
      error: error.message
    });
  }
});

/**
 * @route GET /api/dashboard/integrations/widgets
 * @desc Get available dashboard widgets
 * @access Private (Business Owner/Admin)
 */
router.get('/widgets', authenticateToken, async (req, res) => {
  try {
    const widgets = [
      {
        id: 'overview',
        name: 'نظرة عامة',
        type: 'metrics',
        description: 'مقاييس الأداء العامة',
        defaultSize: { width: 12, height: 2 }
      },
      {
        id: 'integrations',
        name: 'التكاملات',
        type: 'grid',
        description: 'حالة التكاملات النشطة',
        defaultSize: { width: 12, height: 4 }
      },
      {
        id: 'activity',
        name: 'النشاط الأخير',
        type: 'timeline',
        description: 'سجل الأنشطة الأخيرة',
        defaultSize: { width: 6, height: 3 }
      },
      {
        id: 'alerts',
        name: 'التنبيهات',
        type: 'alerts',
        description: 'التنبيهات والإشعارات',
        defaultSize: { width: 6, height: 2 }
      },
      {
        id: 'performance',
        name: 'الأداء',
        type: 'chart',
        description: 'مخططات الأداء والإحصائيات',
        defaultSize: { width: 12, height: 3 }
      },
      {
        id: 'usage',
        name: 'الاستخدام',
        type: 'metrics',
        description: 'مقاييس استخدام النظام',
        defaultSize: { width: 6, height: 2 }
      }
    ];

    res.json({
      success: true,
      data: widgets
    });
  } catch (error) {
    logger.error('[Integration Dashboard Routes] Get widgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard widgets',
      error: error.message
    });
  }
});

/**
 * @route POST /api/dashboard/integrations/layout
 * @desc Save dashboard layout
 * @access Private (Business Owner/Admin)
 */
router.post('/layout', authenticateToken, async (req, res) => {
  try {
    const { layout, businessId } = req.body;

    if (!layout || !Array.isArray(layout)) {
      return res.status(400).json({
        success: false,
        message: 'Layout array is required'
      });
    }

    // In a real implementation, this would save to database
    logger.info('[Integration Dashboard Routes] Layout saved for business:', { businessId });

    res.json({
      success: true,
      message: 'Dashboard layout saved successfully'
    });
  } catch (error) {
    logger.error('[Integration Dashboard Routes] Save layout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save dashboard layout',
      error: error.message
    });
  }
});

/**
 * @route GET /api/dashboard/integrations/layout
 * @desc Get saved dashboard layout
 * @access Private (Business Owner/Admin)
 */
router.get('/layout', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;

    // In a real implementation, this would fetch from database
    const defaultLayout = [
      { id: 'overview', x: 0, y: 0, width: 12, height: 2 },
      { id: 'integrations', x: 0, y: 2, width: 8, height: 4 },
      { id: 'activity', x: 8, y: 2, width: 4, height: 4 },
      { id: 'alerts', x: 0, y: 6, width: 12, height: 2 }
    ];

    res.json({
      success: true,
      data: {
        businessId,
        layout: defaultLayout
      }
    });
  } catch (error) {
    logger.error('[Integration Dashboard Routes] Get layout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard layout',
      error: error.message
    });
  }
});

/**
 * @route POST /api/dashboard/integrations/share
 * @desc Share dashboard with team members
 * @access Private (Business Owner/Admin)
 */
router.post('/share', authenticateToken, async (req, res) => {
  try {
    const { userIds, permissions } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    // In a real implementation, this would update user permissions
    logger.info('[Integration Dashboard Routes] Dashboard shared with users:', { userIds, count: userIds.length });

    res.json({
      success: true,
      message: 'Dashboard shared successfully',
      data: {
        sharedWith: userIds.length,
        permissions: permissions || ['view']
      }
    });
  } catch (error) {
    logger.error('[Integration Dashboard Routes] Share dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share dashboard',
      error: error.message
    });
  }
});

module.exports = router;
