const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const IntegrationsService = require('../services/integrations.service');

/**
 * @route GET /api/integrations
 * @desc Get all integrations status
 * @access Private (Business Owner/Admin)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const integrations = IntegrationsService.getAllIntegrationsStatus();
    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    logger.error('[Integrations Routes] Get all error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get integrations',
      error: error.message
    });
  }
});

/**
 * @route GET /api/integrations/:integrationId
 * @desc Get integration status
 * @access Private (Business Owner/Admin)
 */
router.get('/:integrationId', authenticateToken, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const integration = IntegrationsService.getIntegrationStatus(integrationId);

    if (integration.error) {
      return res.status(404).json({
        success: false,
        message: integration.error
      });
    }

    res.json({
      success: true,
      data: integration
    });
  } catch (error) {
    logger.error('[Integrations Routes] Get integration error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get integration status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/integrations/:integrationId/configure
 * @desc Configure integration
 * @access Private (Business Owner/Admin)
 */
router.post('/:integrationId/configure', authenticateToken, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const config = req.body;

    const result = await IntegrationsService.configureIntegration(integrationId, config);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Integrations Routes] Configure error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to configure integration',
      error: error.message
    });
  }
});

/**
 * @route POST /api/integrations/:integrationId/test
 * @desc Test integration connection
 * @access Private (Business Owner/Admin)
 */
router.post('/:integrationId/test', authenticateToken, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const result = await IntegrationsService.testIntegration(integrationId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Integrations Routes] Test error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to test integration',
      error: error.message
    });
  }
});

/**
 * @route POST /api/integrations/:integrationId/send
 * @desc Send message via integration
 * @access Private
 */
router.post('/:integrationId/send', authenticateToken, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const message = req.body;

    if (!message.text) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    const result = await IntegrationsService.sendMessage(integrationId, message);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Integrations Routes] Send message error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

/**
 * @route POST /api/integrations/:integrationId/crm/sync
 * @desc Sync data with CRM
 * @access Private
 */
router.post('/:integrationId/crm/sync', authenticateToken, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const data = req.body;

    const result = await IntegrationsService.syncWithCRM(integrationId, data);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Integrations Routes] CRM sync error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to sync with CRM',
      error: error.message
    });
  }
});

/**
 * @route POST /api/integrations/:integrationId/webhook
 * @desc Register webhook for integration
 * @access Private (Business Owner/Admin)
 */
router.post('/:integrationId/webhook', authenticateToken, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const { webhookUrl, config } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL is required'
      });
    }

    const result = await IntegrationsService.registerWebhook(integrationId, webhookUrl, config);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Integrations Routes] Webhook registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register webhook',
      error: error.message
    });
  }
});

/**
 * @route POST /api/integrations/webhook/:integrationId
 * @desc Handle incoming webhook
 * @access Public (for webhooks)
 */
router.post('/webhook/:integrationId', async (req, res) => {
  try {
    const { integrationId } = req.params;
    const payload = req.body;

    const result = await IntegrationsService.handleWebhook(integrationId, payload);

    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('[Integrations Routes] Webhook handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle webhook',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/integrations/:integrationId
 * @desc Remove integration
 * @access Private (Business Owner/Admin)
 */
router.delete('/:integrationId', authenticateToken, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const result = await IntegrationsService.removeIntegration(integrationId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Integrations Routes] Remove integration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove integration',
      error: error.message
    });
  }
});

/**
 * @route GET /api/integrations/whatsapp/qr
 * @desc Get WhatsApp QR code for business verification
 * @access Private (Business Owner/Admin)
 */
router.get('/whatsapp/qr', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, this would generate or retrieve QR code
    res.json({
      success: true,
      data: {
        qrCode: 'whatsapp_qr_code_placeholder',
        instructions: 'Scan this QR code with WhatsApp Business app to verify your business'
      }
    });
  } catch (error) {
    console.error('[Integrations Routes] WhatsApp QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get WhatsApp QR code',
      error: error.message
    });
  }
});

/**
 * @route POST /api/integrations/telegram/set-commands
 * @desc Set Telegram bot commands
 * @access Private (Business Owner/Admin)
 */
router.post('/telegram/set-commands', authenticateToken, async (req, res) => {
  try {
    const commands = req.body.commands || [
      { command: 'start', description: 'بدء المحادثة' },
      { command: 'help', description: 'المساعدة' },
      { command: 'status', description: 'حالة الطلب' }
    ];

    // In a real implementation, this would call Telegram API
    res.json({
      success: true,
      message: 'Telegram commands set successfully',
      data: { commands }
    });
  } catch (error) {
    console.error('[Integrations Routes] Telegram commands error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set Telegram commands',
      error: error.message
    });
  }
});

/**
 * @route GET /api/integrations/logs/:integrationId
 * @desc Get integration logs
 * @access Private (Business Owner/Admin)
 */
router.get('/logs/:integrationId', authenticateToken, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // In a real implementation, this would fetch logs from database
    const logs = [
      {
        id: 'log_1',
        integrationId,
        type: 'message_sent',
        status: 'success',
        timestamp: new Date(),
        details: { messageId: 'msg_123' }
      }
    ];

    res.json({
      success: true,
      data: {
        integrationId,
        count: logs.length,
        logs: logs.slice(0, limit)
      }
    });
  } catch (error) {
    console.error('[Integrations Routes] Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get integration logs',
      error: error.message
    });
  }
});

module.exports = router;
