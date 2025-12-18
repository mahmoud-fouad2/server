import asyncHandler from 'express-async-handler';
import prisma from '../config/database.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import integrationsService from '../services/integrations.service.js';

/**
 * @desc    List integration status for available integrations (global statuses)
 * @route   GET /api/admin/integrations
 * @access  SUPERADMIN
 */
export const getIntegrations = asyncHandler(async (req, res) => {
  const statuses = integrationsService.getAllIntegrationsStatus();
  res.json({ data: statuses });
});

/**
 * @desc    Get integration config for a business (by type and businessId)
 * @route   GET /api/admin/integrations/:type
 * @access  SUPERADMIN
 */
export const getIntegrationForBusiness = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { businessId } = req.query;

  if (!businessId) {
    res.status(400);
    throw new Error('businessId is required');
  }

  let result = null;

  switch (type.toLowerCase()) {
    case 'whatsapp':
      result = await prisma.whatsAppIntegration.findUnique({ where: { businessId } });
      break;
    case 'telegram':
      result = await prisma.telegramIntegration.findUnique({ where: { businessId } });
      break;
    case 'facebook':
      // Use generic APIIntegration for facebook/messenger
      result = await prisma.apiIntegration.findFirst({ where: { businessId, name: 'facebook' } });
      break;
    case 'infoseed':
      result = await prisma.apiIntegration.findFirst({ where: { businessId, name: 'infoseed' } });
      break;
    default:
      res.status(400);
      throw new Error('Unsupported integration type');
  }

  res.json({ data: result });
});

/**
 * @desc    Create or update an integration for a business
 * @route   PUT /api/admin/integrations/:type
 * @access  SUPERADMIN
 */
export const upsertIntegration = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { businessId, config = {}, isActive = true } = req.body;

  if (!businessId) {
    res.status(400);
    throw new Error('businessId is required');
  }

  // Validate/Configure via service first (may test the connection)
  try {
    const configureResult = await integrationsService.configureIntegration(type.toLowerCase(), config);

    // Persist to DB depending on type
    let record = null;
    if (type.toLowerCase() === 'whatsapp') {
      record = await prisma.whatsAppIntegration.upsert({
        where: { businessId },
        update: { ...config, isActive },
        create: { businessId, ...config, isActive }
      });
    } else if (type.toLowerCase() === 'telegram') {
      record = await prisma.telegramIntegration.upsert({
        where: { businessId },
        update: { ...config, isActive },
        create: { businessId, ...config, isActive }
      });
    } else if (['facebook', 'infoseed'].includes(type.toLowerCase())) {
      // Encrypt API key if provided
      let encryptedApiKey = undefined;
      if (config.apiKey) {
        const iv = crypto.randomBytes(16);
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-change-in-production', 'salt', 32);
        const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
        let encrypted = cipher.update(String(config.apiKey), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        encryptedApiKey = iv.toString('hex') + ':' + encrypted;
      }
      // Store generic API integration entry
      record = await prisma.apiIntegration.upsert({
        where: { id: `${businessId}-${type.toLowerCase()}` },
        update: { baseUrl: config.baseUrl || undefined, ...(encryptedApiKey ? { apiKey: encryptedApiKey } : {}), isActive },
        create: { id: `${businessId}-${type.toLowerCase()}`, businessId, name: type.toLowerCase(), type: 'REST', baseUrl: config.baseUrl || '', apiKey: encryptedApiKey || '', isActive }
      });
      // Store generic API integration entry
      record = await prisma.apiIntegration.upsert({
        where: { id: `${businessId}-${type.toLowerCase()}` },
        update: { baseUrl: config.baseUrl || undefined, apiKey: config.apiKey || undefined, isActive },
        create: { id: `${businessId}-${type.toLowerCase()}`, businessId, name: type.toLowerCase(), type: 'REST', baseUrl: config.baseUrl || '', apiKey: config.apiKey || '', isActive }
      });
    } else {
      res.status(400);
      throw new Error('Unsupported integration type');
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'INTEGRATION_UPDATE',
        entity: 'Integration',
        entityId: `${businessId}:${type.toLowerCase()}`,
        changes: { after: config, isActive },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({ message: 'Integration updated', data: { configureResult, record } });
  } catch (error) {
    logger.error('Failed to upsert integration', error);
    res.status(400);
    throw new Error(error.message || 'Failed to configure integration');
  }
});

/**
 * @desc    Test integration connection (without persisting)
 * @route   POST /api/admin/integrations/:type/test
 * @access  SUPERADMIN
 */
export const testIntegration = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const config = req.body || {};

  try {
    const result = await integrationsService.testIntegration(type.toLowerCase(), config);
    res.json({ data: result });
  } catch (error) {
    logger.error('Integration test failed', error);
    res.status(400);
    throw new Error(error.message || 'Test failed');
  }
});
