/**
 * Admin Conversation Management Routes
 * Manage conversations, messages, and analytics for SUPERADMIN
 */

import express from 'express';
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorization.js';
const logger = require('../utils/logger');
const asyncHandler = require('express-async-handler');

// All routes require authentication
router.use(authenticateToken);

// ============================================
// 💬 CONVERSATION MANAGEMENT
// ============================================

/**
 * @route   GET /api/admin/conversations
 * @desc    Get all conversations with pagination and filtering
 * @access  SUPERADMIN
 */
router.get(
  '/conversations',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, businessId = '', status = '', search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(businessId && { businessId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { externalId: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } },
          { messages: { some: { content: { contains: search, mode: 'insensitive' } } } }
        ]
      })
    };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              planType: true
            }
          },
          _count: {
            select: { messages: true }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              content: true,
              role: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.conversation.count({ where })
    ]);

    res.json({
      success: true,
      data: conversations,
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
 * @route   GET /api/admin/conversations/:id
 * @desc    Get conversation by ID with all messages
 * @access  SUPERADMIN
 */
router.get(
  '/conversations/:id',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            planType: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        visitorSession: {
          select: {
            id: true,
            country: true,
            city: true,
            device: true
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  })
);

/**
 * @route   DELETE /api/admin/conversations/:id
 * @desc    Delete conversation and all messages
 * @access  SUPERADMIN
 */
router.delete(
  '/conversations/:id',
  requirePermission('system:delete'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Delete all messages first (cascade)
    await prisma.message.deleteMany({
      where: { conversationId: id }
    });

    // Delete conversation
    await prisma.conversation.delete({
      where: { id }
    });

    logger.warn(`Admin ${req.user.email} deleted conversation ${id}`);

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  })
);

/**
 * @route   POST /api/admin/conversations/bulk-delete
 * @desc    Bulk delete conversations
 * @access  SUPERADMIN
 */
router.post(
  '/conversations/bulk-delete',
  requirePermission('system:delete'),
  asyncHandler(async (req, res) => {
    const { conversationIds } = req.body;

    if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'conversationIds array is required'
      });
    }

    // Delete messages first
    await prisma.message.deleteMany({
      where: {
        conversationId: { in: conversationIds }
      }
    });

    // Delete conversations
    const result = await prisma.conversation.deleteMany({
      where: {
        id: { in: conversationIds }
      }
    });

    logger.warn(`Admin ${req.user.email} bulk deleted ${result.count} conversations`);

    res.json({
      success: true,
      message: `Deleted ${result.count} conversations`,
      count: result.count
    });
  })
);

// ============================================
// 📊 CONVERSATION ANALYTICS
// ============================================

/**
 * @route   GET /api/admin/conversations/analytics
 * @desc    Get conversation analytics
 * @access  SUPERADMIN
 */
router.get(
  '/conversations/analytics',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { days = 30, businessId = '' } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const where = {
      createdAt: { gte: since },
      ...(businessId && { businessId })
    };

    const [
      totalConversations,
      activeConversations,
      closedConversations,
      conversationsByStatus,
      conversationsByDay,
      averageMessagesPerConversation,
      topBusinesses
    ] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.conversation.count({ where: { ...where, status: 'CLOSED' } }),
      prisma.conversation.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      }),
      (async () => {
        if (businessId) {
          return prisma.$queryRaw`
            SELECT 
              DATE("createdAt") as date,
              COUNT(*)::int as count
            FROM "Conversation"
            WHERE "createdAt" >= ${since}
              AND "businessId" = ${businessId}
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
          `;
        } else {
          return prisma.$queryRaw`
            SELECT 
              DATE("createdAt") as date,
              COUNT(*)::int as count
            FROM "Conversation"
            WHERE "createdAt" >= ${since}
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
          `;
        }
      })(),
      prisma.conversation.findMany({
        where,
        include: {
          _count: {
            select: { messages: true }
          }
        }
      }).then(convs => {
        if (convs.length === 0) return 0;
        const total = convs.reduce((sum, c) => sum + c._count.messages, 0);
        return (total / convs.length).toFixed(2);
      }),
      prisma.conversation.groupBy({
        by: ['businessId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }).then(async (groups) => {
        const businessIds = groups.map(g => g.businessId);
        const businesses = await prisma.business.findMany({
          where: { id: { in: businessIds } },
          select: { id: true, name: true }
        });
        return groups.map(g => ({
          businessId: g.businessId,
          businessName: businesses.find(b => b.id === g.businessId)?.name || 'Unknown',
          count: g._count.id
        }));
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: totalConversations,
          active: activeConversations,
          closed: closedConversations,
          period: `${days} days`
        },
        byStatus: conversationsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {}),
        byDay: conversationsByDay,
        metrics: {
          averageMessagesPerConversation: parseFloat(averageMessagesPerConversation)
        },
        topBusinesses
      }
    });
  })
);

export default router;

