/**
 * Payment Routes
 * Customer-facing payment endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const paymentService = require('../services/payment.service');
const prisma = require('../config/database');
const logger = require('../utils/logger');
const asyncHandler = require('express-async-handler');

// NOTE: initialization of payment gateways is deferred until after DB connectivity
// to avoid running DB-dependent code during module load. See `index.js` startup sequence.

/**
 * @route   GET /api/payments/gateways
 * @desc    Get available payment gateways
 * @access  Private
 */
router.get(
  '/gateways',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const gateways = await paymentService.getAvailableGateways();
    res.json({
      success: true,
      data: gateways
    });
  })
);

/**
 * @route   POST /api/payments/create
 * @desc    Create payment intent
 * @access  Private
 */
router.post(
  '/create',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { amount, currency = 'SAR', planType, messageQuota, gatewayId, customDescription } = req.body;
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;

    if (!amount || !gatewayId) {
      return res.status(400).json({
        success: false,
        error: 'Amount and gatewayId are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    const paymentIntent = await paymentService.createPaymentIntent({
      businessId,
      userId,
      amount: parseFloat(amount),
      currency,
      planType,
      messageQuota: messageQuota ? parseInt(messageQuota) : null,
      gatewayId,
      customDescription
    });

    res.json({
      success: true,
      data: paymentIntent
    });
  })
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment details
 * @access  Private
 */
router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        userId
      },
      include: {
        gateway: {
          select: {
            id: true,
            provider: true,
            name: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  })
);

/**
 * @route   GET /api/payments
 * @desc    Get user payments history
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          gateway: {
            select: {
              id: true,
              provider: true,
              name: true,
              icon: true
            }
          },
          business: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.payment.count({ where: { userId } })
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  })
);

module.exports = router;

