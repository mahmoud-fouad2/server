/**
 * Admin Payment Gateway Management Routes
 * SUPERADMIN only - Manage payment gateways
 */

import express from 'express';
const router = express.Router();
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorization.js';
import prisma from '../config/database.js';
import paymentService from '../services/payment.service.js';
import logger from '../utils/logger.js';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';

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
 * @route   PUT /api/admin/payments/gateways/:id
 * @desc    Update payment gateway by id (partial update)
 * @access  SUPERADMIN
 */
router.put(
  '/gateways/:id',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      name,
      displayName,
      icon,
      description,
      apiKey,
      secretKey,
      merchantId,
      webhookSecret,
      config,
      isEnabled,
      isActive
    } = req.body;

    // Fetch existing gateway to compute changes for audit logging
    const existing = await prisma.paymentGateway.findUnique({ where: { id } });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (icon !== undefined) updateData.icon = icon;
    if (description !== undefined) updateData.description = description;
    if (merchantId !== undefined) updateData.merchantId = merchantId;
    if (config !== undefined) updateData.config = config;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Encrypt sensitive fields if provided
    if (apiKey !== undefined && apiKey !== '') updateData.apiKey = encrypt(apiKey);
    if (secretKey !== undefined && secretKey !== '') updateData.secretKey = encrypt(secretKey);
    if (webhookSecret !== undefined && webhookSecret !== '') updateData.webhookSecret = encrypt(webhookSecret);

    // Audit: compute changed fields (don't include secret values)
    const changed = [];
    if (existing) {
      if (name !== undefined && name !== existing.name) changed.push('name');
      if (displayName !== undefined && displayName !== existing.displayName) changed.push('displayName');
      if (icon !== undefined && icon !== existing.icon) changed.push('icon');
      if (description !== undefined && description !== existing.description) changed.push('description');
      if (merchantId !== undefined && merchantId !== existing.merchantId) changed.push('merchantId');
      if (config !== undefined && JSON.stringify(config) !== JSON.stringify(existing.config)) changed.push('config');
      if (isEnabled !== undefined && isEnabled !== existing.isEnabled) changed.push('isEnabled');
      if (isActive !== undefined && isActive !== existing.isActive) changed.push('isActive');
      if (apiKey !== undefined && apiKey !== '') changed.push('apiKey (updated)');
      if (secretKey !== undefined && secretKey !== '') changed.push('secretKey (updated)');
      if (webhookSecret !== undefined && webhookSecret !== '') changed.push('webhookSecret (updated)');
    }

    const gateway = await prisma.paymentGateway.update({
      where: { id },
      data: updateData
    });

    // Write audit log for gateway update without exposing secret contents
    if (changed.length > 0) {
      logger.info(`Admin ${req.user.email} updated payment gateway ${gateway.id}. Changed fields: ${changed.join(', ')}`);
    }

    // Reinitialize gateways after changes
    await paymentService.initializeGateways();

    // Return safe gateway info (don't leak secrets)
    const safe = {
      id: gateway.id,
      provider: gateway.provider,
      name: gateway.name,
      displayName: gateway.displayName,
      icon: gateway.icon,
      description: gateway.description,
      isEnabled: gateway.isEnabled,
      isActive: gateway.isActive,
      hasApiKey: !!gateway.apiKey,
      hasSecretKey: !!gateway.secretKey,
      hasMerchantId: !!gateway.merchantId,
      config: gateway.config,
      createdAt: gateway.createdAt,
      updatedAt: gateway.updatedAt
    };

    logger.info(`Admin ${req.user.email} updated payment gateway ${gateway.id}`);

    res.json({ success: true, message: 'Payment gateway updated', data: safe });
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

/**
 * @route   GET /api/admin/payments/invoices
 * @desc    List payments with pagination & filtering
 * @access  SUPERADMIN
 */
router.get(
  '/invoices',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search, businessId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { customDescription: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (businessId) where.businessId = businessId;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { id: true, name: true } },
          gateway: { select: { id: true, name: true, provider: true } }
        }
      }),
      prisma.payment.count({ where })
    ]);

    res.json({ success: true, data: payments, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  })
);

/**
 * @route   GET /api/admin/payments/invoices/:id
 * @desc    Get single invoice/payment details
 * @access  SUPERADMIN
 */
router.get(
  '/invoices/:id',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true } },
        gateway: { select: { id: true, name: true, provider: true } }
      }
    });

    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

    res.json({ success: true, data: payment });
  })
);

/**
 * @route   GET /api/admin/payments/subscriptions
 * @desc    List subscriptions
 * @access  SUPERADMIN
 */
router.get(
  '/subscriptions',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, businessId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (businessId) where.businessId = businessId;

    const [subs, total] = await Promise.all([
      prisma.subscription.findMany({ where, skip, take: parseInt(limit), orderBy: { startDate: 'desc' } }),
      prisma.subscription.count({ where })
    ]);

    res.json({ success: true, data: subs, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  })
);

export default router;

