/**
 * Admin Payment Gateway Management Routes
 * SUPERADMIN only - Manage payment gateways
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const prisma = require('../config/database');
const paymentService = require('../services/payment.service');
const logger = require('../utils/logger');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');

// All routes require authentication
router.use(authenticateToken);

/**
 * Encrypt sensitive data
 */
function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-change-in-production', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedText) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-change-in-production', 'salt', 32);
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * @route   GET /api/admin/payments/gateways
 * @desc    Get all payment gateways
 * @access  SUPERADMIN
 */
router.get(
  '/gateways',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const gateways = await prisma.paymentGateway.findMany({
      orderBy: { name: 'asc' }
    });

    // Don't expose sensitive data
    const safeGateways = gateways.map(g => ({
      id: g.id,
      provider: g.provider,
      name: g.name,
      displayName: g.displayName,
      icon: g.icon,
      description: g.description,
      isEnabled: g.isEnabled,
      isActive: g.isActive,
      hasApiKey: !!g.apiKey,
      hasSecretKey: !!g.secretKey,
      hasMerchantId: !!g.merchantId,
      config: g.config,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt
    }));

    res.json({
      success: true,
      data: safeGateways
    });
  })
);

/**
 * @route   POST /api/admin/payments/gateways
 * @desc    Create or update payment gateway
 * @access  SUPERADMIN
 */
router.post(
  '/gateways',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const {
      provider,
      name,
      apiKey,
      secretKey,
      merchantId,
      webhookSecret,
      config,
      isEnabled,
      isActive,
      displayName,
      icon,
      description
    } = req.body;

    if (!provider || !name) {
      return res.status(400).json({
        success: false,
        error: 'Provider and name are required'
      });
    }

    // Encrypt sensitive data
    const encryptedApiKey = apiKey ? encrypt(apiKey) : undefined;
    const encryptedSecretKey = secretKey ? encrypt(secretKey) : undefined;
    const encryptedWebhookSecret = webhookSecret ? encrypt(webhookSecret) : undefined;

    const gateway = await prisma.paymentGateway.upsert({
      where: { provider },
      create: {
        provider,
        name,
        apiKey: encryptedApiKey,
        secretKey: encryptedSecretKey,
        merchantId,
        webhookSecret: encryptedWebhookSecret,
        config: config || {},
        isEnabled: isEnabled !== undefined ? isEnabled : false,
        isActive: isActive !== undefined ? isActive : true,
        displayName,
        icon,
        description
      },
      update: {
        name,
        ...(apiKey !== undefined && { apiKey: encryptedApiKey }),
        ...(secretKey !== undefined && { secretKey: encryptedSecretKey }),
        ...(merchantId !== undefined && { merchantId }),
        ...(webhookSecret !== undefined && { webhookSecret: encryptedWebhookSecret }),
        ...(config !== undefined && { config }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(isActive !== undefined && { isActive }),
        ...(displayName !== undefined && { displayName }),
        ...(icon !== undefined && { icon }),
        ...(description !== undefined && { description })
      }
    });

    // Reinitialize gateways
    await paymentService.initializeGateways();

    logger.info(`Admin ${req.user.email} ${gateway.id ? 'updated' : 'created'} payment gateway ${provider}`);

    res.json({
      success: true,
      message: 'Payment gateway saved successfully',
      data: {
        id: gateway.id,
        provider: gateway.provider,
        name: gateway.name,
        isEnabled: gateway.isEnabled,
        isActive: gateway.isActive
      }
    });
  })
);

/**
 * @route   PATCH /api/admin/payments/gateways/:id/toggle
 * @desc    Toggle gateway active status
 * @access  SUPERADMIN
 */
router.patch(
  '/gateways/:id/toggle',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const gateway = await prisma.paymentGateway.update({
      where: { id },
      data: { isActive: isActive !== undefined ? isActive : true }
    });

    await paymentService.initializeGateways();

    res.json({
      success: true,
      message: `Gateway ${gateway.isActive ? 'activated' : 'deactivated'}`,
      data: gateway
    });
  })
);

/**
 * @route   DELETE /api/admin/payments/gateways/:id
 * @desc    Delete payment gateway
 * @access  SUPERADMIN
 */
router.delete(
  '/gateways/:id',
  requirePermission('system:delete'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.paymentGateway.delete({
      where: { id }
    });

    await paymentService.initializeGateways();

    logger.warn(`Admin ${req.user.email} deleted payment gateway ${id}`);

    res.json({
      success: true,
      message: 'Payment gateway deleted successfully'
    });
  })
);

/**
 * @route   POST /api/admin/payments/create-custom
 * @desc    Create custom payment for customer (Admin-initiated)
 * @access  SUPERADMIN
 */
router.post(
  '/create-custom',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const { businessId, amount, currency = 'SAR', description, messageQuota, planType } = req.body;

    if (!businessId || !amount || !description) {
      return res.status(400).json({
        success: false,
        error: 'businessId, amount, and description are required'
      });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { user: true }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Create payment record (status: COMPLETED immediately for admin-created payments)
    const payment = await prisma.payment.create({
      data: {
        businessId,
        userId: business.userId,
        amount: parseFloat(amount),
        currency,
        status: 'COMPLETED',
        provider: 'ADMIN',
        customAmount: true,
        customDescription: description,
        messageQuota: messageQuota ? parseInt(messageQuota) : null,
        planType: planType || null,
        paidAt: new Date(),
        webhookVerified: true
      }
    });

    // Update business quota
    if (messageQuota) {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          messageQuota: {
            increment: parseInt(messageQuota)
          },
          ...(planType && { planType })
        }
      });
    }

    // Create subscription if plan type provided
    if (planType && planType !== 'TRIAL') {
      await prisma.subscription.create({
        data: {
          businessId,
          userId: business.userId,
          planType,
          messageQuota: messageQuota ? parseInt(messageQuota) : 0,
          paymentId: payment.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      });
    }

    logger.info(`Admin ${req.user.email} created custom payment for business ${businessId}`, {
      amount,
      description
    });

    res.json({
      success: true,
      message: 'Custom payment created successfully',
      data: payment
    });
  })
);

module.exports = router;

