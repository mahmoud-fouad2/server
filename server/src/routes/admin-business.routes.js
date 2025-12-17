/**
 * Admin Business Management Routes
 * Comprehensive business management for SUPERADMIN
 */

import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorization.js';
import logger from '../utils/logger.js';
import asyncHandler from 'express-async-handler';

// All routes require authentication
router.use(authenticateToken);

// ============================================
// 📊 BUSINESS MANAGEMENT
// ============================================

/**
 * @route   GET /api/admin/businesses
 * @desc    Get all businesses with pagination and filtering
 * @access  SUPERADMIN
 */
router.get(
  '/businesses',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '', status = '', planType = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status && { status }),
      ...(planType && { planType })
    };

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          },
          _count: {
            select: {
              conversations: true,
              knowledgeBase: true
            }
          }
        }
      }),
      prisma.business.count({ where })
    ]);

    res.json({
      success: true,
      data: businesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  })
);

/**
 * @route   GET /api/admin/businesses/:id
 * @desc    Get business by ID with full details
 * @access  SUPERADMIN
 */
router.get(
  '/businesses/:id',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true
          }
        },
        conversations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { messages: true }
            }
          }
        },
        knowledgeBase: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            conversations: true,
            knowledgeBase: true
          }
        }
      }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    res.json({
      success: true,
      data: business
    });
  })
);

/**
 * @route   PUT /api/admin/businesses/:id
 * @desc    Update business details
 * @access  SUPERADMIN
 */
router.put(
  '/businesses/:id',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      name, 
      status, 
      planType, 
      messageQuota, 
      messagesUsed, 
      widgetConfig, 
      botTone, 
      primaryColor,
      preChatFormEnabled,
      crmLeadCollectionEnabled
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (planType !== undefined) updateData.planType = planType;
    if (messageQuota !== undefined) updateData.messageQuota = parseInt(messageQuota);
    if (messagesUsed !== undefined) updateData.messagesUsed = parseInt(messagesUsed);
    if (widgetConfig !== undefined) updateData.widgetConfig = typeof widgetConfig === 'string' ? widgetConfig : JSON.stringify(widgetConfig);
    if (botTone !== undefined) updateData.botTone = botTone;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (preChatFormEnabled !== undefined) updateData.preChatFormEnabled = preChatFormEnabled;
    if (crmLeadCollectionEnabled !== undefined) updateData.crmLeadCollectionEnabled = crmLeadCollectionEnabled;

    const business = await prisma.business.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'Business',
        entityId: id,
        changes: { after: updateData },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    }).catch((err) => { // Log but don't fail request if audits are not available
      const logger = require('../utils/logger');
      logger.warn('Failed to create audit log for business update', { error: err && err.message });
    });

    logger.info(`Admin ${req.user.email} updated business ${id}`, updateData);

    res.json({
      success: true,
      message: 'Business updated successfully',
      data: business
    });
  })
);

/**
 * @route   PUT /api/admin/businesses/:id/quota
 * @desc    Update business message quota
 * @access  SUPERADMIN
 */
router.put(
  '/businesses/:id/quota',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { messageQuota, messagesUsed, resetUsage } = req.body;

    const updateData = {};
    if (messageQuota !== undefined) updateData.messageQuota = parseInt(messageQuota);
    if (resetUsage) {
      updateData.messagesUsed = 0;
    } else if (messagesUsed !== undefined) {
      updateData.messagesUsed = parseInt(messagesUsed);
    }

    const business = await prisma.business.update({
      where: { id },
      data: updateData
    });

    logger.info(`Admin ${req.user.email} updated quota for business ${id}`, updateData);

    res.json({
      success: true,
      message: 'Quota updated successfully',
      data: {
        messageQuota: business.messageQuota,
        messagesUsed: business.messagesUsed,
        remaining: business.messageQuota - business.messagesUsed
      }
    });
  })
);

/**
 * @route   PUT /api/admin/businesses/:id/plan
 * @desc    Update business plan type
 * @access  SUPERADMIN
 */
router.put(
  '/businesses/:id/plan',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { planType, messageQuota } = req.body;

    const planQuotas = {
      TRIAL: 100,
      BASIC: 500,      // Package A: 500 chats/month
      PRO: 1500,       // Package B: 1,500 chats/month
      AGENCY: 3000,    // Package C: 3,000 chats/month
      ENTERPRISE: 999999
    };

    const updateData = {
      planType
    };

    // Auto-set quota based on plan if not specified
    if (messageQuota !== undefined) {
      updateData.messageQuota = parseInt(messageQuota);
    } else if (planQuotas[planType]) {
      updateData.messageQuota = planQuotas[planType];
    }

    const business = await prisma.business.update({
      where: { id },
      data: updateData
    });

    logger.info(`Admin ${req.user.email} updated plan for business ${id} to ${planType}`);

    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: business
    });
  })
);

/**
 * @route   DELETE /api/admin/businesses/:id
 * @desc    Delete business (soft delete)
 * @access  SUPERADMIN
 */
router.delete(
  '/businesses/:id',
  requirePermission('system:delete'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            conversations: true,
            knowledgeBase: true
          }
        }
      }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Soft delete by setting status to SUSPENDED
    await prisma.business.update({
      where: { id },
      data: {
        status: 'SUSPENDED'
      }
    });

    logger.warn(`Admin ${req.user.email} deleted business ${id}`, { reason, stats: business._count });

    res.json({
      success: true,
      message: 'Business deleted successfully'
    });
  })
);

/**
 * @route   POST /api/admin/businesses/:id/activate
 * @desc    Activate suspended business
 * @access  SUPERADMIN
 */
router.post(
  '/businesses/:id/activate',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const business = await prisma.business.update({
      where: { id },
      data: {
        status: 'ACTIVE'
      }
    });

    logger.info(`Admin ${req.user.email} activated business ${id}`);

    res.json({
      success: true,
      message: 'Business activated successfully',
      data: business
    });
  })
);

// ============================================
// 📊 BUSINESS STATISTICS
// ============================================

/**
 * @route   GET /api/admin/businesses/:id/stats
 * @desc    Get detailed statistics for a business
 * @access  SUPERADMIN
 */
router.get(
  '/businesses/:id/stats',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const [
      totalConversations,
      totalMessages,
      activeUsers,
      knowledgeBaseCount,
      conversations,
      messages
    ] = await Promise.all([
      prisma.conversation.count({ where: { businessId: id } }),
      prisma.message.count({ where: { conversation: { businessId: id } } }),
      prisma.conversation.groupBy({
        by: ['externalId'],
        where: { businessId: id, createdAt: { gte: since } }
      }).then(groups => groups.length),
      prisma.knowledgeBase.count({ where: { businessId: id } }),
      prisma.conversation.count({
        where: {
          businessId: id,
          createdAt: { gte: since }
        }
      }),
      prisma.message.count({
        where: {
          conversation: { businessId: id },
          createdAt: { gte: since }
        }
      })
    ]);

    const business = await prisma.business.findUnique({
      where: { id },
      select: {
        messageQuota: true,
        messagesUsed: true,
        planType: true,
        status: true
      }
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalConversations,
          totalMessages,
          activeUsers,
          knowledgeBaseCount
        },
        recent: {
          conversations,
          messages,
          period: `${days} days`
        },
        quota: {
          messageQuota: business?.messageQuota || 0,
          messagesUsed: business?.messagesUsed || 0,
          remaining: (business?.messageQuota || 0) - (business?.messagesUsed || 0),
          usagePercentage: business?.messageQuota 
            ? Math.round((business.messagesUsed / business.messageQuota) * 100)
            : 0
        },
        plan: {
          type: business?.planType || 'TRIAL',
          status: business?.status || 'TRIAL'
        }
      }
    });
  })
);

// ============================================
// 🔄 BULK OPERATIONS
// ============================================

/**
 * @route   POST /api/admin/businesses/bulk-update
 * @desc    Bulk update multiple businesses
 * @access  SUPERADMIN
 */
router.post(
  '/businesses/bulk-update',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const { businessIds, updates } = req.body;

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'businessIds array is required'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'updates object is required'
      });
    }

    const updateData = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.planType !== undefined) updateData.planType = updates.planType;
    if (updates.messageQuota !== undefined) updateData.messageQuota = parseInt(updates.messageQuota);

    const result = await prisma.business.updateMany({
      where: {
        id: { in: businessIds }
      },
      data: updateData
    });

    logger.info(`Admin ${req.user.email} bulk updated ${result.count} businesses`, { updates });

    res.json({
      success: true,
      message: `Updated ${result.count} businesses`,
      count: result.count
    });
  })
);

/**
 * @route   POST /api/admin/businesses/bulk-reset-quota
 * @desc    Reset message usage for multiple businesses
 * @access  SUPERADMIN
 */
router.post(
  '/businesses/bulk-reset-quota',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const { businessIds } = req.body;

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'businessIds array is required'
      });
    }

    const result = await prisma.business.updateMany({
      where: {
        id: { in: businessIds }
      },
      data: {
        messagesUsed: 0
      }
    });

    logger.info(`Admin ${req.user.email} reset quota for ${result.count} businesses`);

    res.json({
      success: true,
      message: `Reset quota for ${result.count} businesses`,
      count: result.count
    });
  })
);

// ============================================
// 📤 EXPORT/IMPORT
// ============================================

/**
 * @route   GET /api/admin/businesses/:id/export
 * @desc    Export business data (GDPR compliance)
 * @access  SUPERADMIN
 */
router.get(
  '/businesses/:id/export',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          }
        },
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        knowledgeBase: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Remove sensitive data
    if (business.user) {
      delete business.user.password;
    }

    logger.info(`Admin ${req.user.email} exported data for business ${id}`);

    res.json({
      success: true,
      exportedAt: new Date().toISOString(),
      data: business
    });
  })
);

export default router;

