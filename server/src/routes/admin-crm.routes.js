/**
 * Admin CRM Management Routes
 * SUPERADMIN only - Full control over CRM system
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/authorization');
const prisma = require('../config/database');
const logger = require('../utils/logger');
const asyncHandler = require('express-async-handler');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/admin/crm/businesses
 * @desc    Get all businesses with CRM status
 * @access  SUPERADMIN
 */
router.get(
  '/businesses',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, crmEnabled = '', search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(crmEnabled === 'true' && { crmLeadCollectionEnabled: true }),
      ...(crmEnabled === 'false' && { crmLeadCollectionEnabled: false })
    };

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          activityType: true,
          planType: true,
          preChatFormEnabled: true,
          crmLeadCollectionEnabled: true,
          _count: {
            select: {
              crmLeads: true
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
 * @route   PUT /api/admin/crm/businesses/:id/toggle
 * @desc    Toggle CRM for a business
 * @access  SUPERADMIN
 */
router.put(
  '/businesses/:id/toggle',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'enabled must be a boolean'
      });
    }

    const business = await prisma.business.update({
      where: { id },
      data: { crmLeadCollectionEnabled: enabled }
    });

    logger.info(`Super Admin ${req.user.email} ${enabled ? 'enabled' : 'disabled'} CRM for business ${id}`);

    res.json({
      success: true,
      message: `CRM ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: business.id,
        name: business.name,
        crmLeadCollectionEnabled: business.crmLeadCollectionEnabled
      }
    });
  })
);

/**
 * @route   PUT /api/admin/crm/businesses/:id/pre-chat
 * @desc    Toggle Pre-chat Form for a business
 * @access  SUPERADMIN
 */
router.put(
  '/businesses/:id/pre-chat',
  requirePermission('system:update'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'enabled must be a boolean'
      });
    }

    const business = await prisma.business.update({
      where: { id },
      data: { preChatFormEnabled: enabled }
    });

    logger.info(`Super Admin ${req.user.email} ${enabled ? 'enabled' : 'disabled'} Pre-chat Form for business ${id}`);

    res.json({
      success: true,
      message: `Pre-chat Form ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: business.id,
        name: business.name,
        preChatFormEnabled: business.preChatFormEnabled
      }
    });
  })
);

/**
 * @route   GET /api/admin/crm/leads
 * @desc    Get all CRM leads across all businesses
 * @access  SUPERADMIN
 */
router.get(
  '/leads',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, businessId = '', search = '', startDate = '', endDate = '', source = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(businessId && { businessId }),
      ...(source && { source }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { requestSummary: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [leads, total] = await Promise.all([
      prisma.crmLead.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              activityType: true,
              planType: true
            }
          }
        }
      }),
      prisma.crmLead.count({ where })
    ]);

    res.json({
      success: true,
      data: leads,
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
 * @route   GET /api/admin/crm/stats
 * @desc    Get CRM statistics across all businesses
 * @access  SUPERADMIN
 */
router.get(
  '/stats',
  requirePermission('system:read'),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const where = {
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [
      totalLeads,
      leadsBySource,
      leadsByBusiness,
      businessesWithCrm,
      businessesWithPreChat
    ] = await Promise.all([
      prisma.crmLead.count({ where }),
      prisma.crmLead.groupBy({
        by: ['source'],
        where,
        _count: { id: true }
      }),
      prisma.crmLead.groupBy({
        by: ['businessId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }).then(async (groups) => {
        const businessIds = groups.map(g => g.businessId);
        const businesses = await prisma.business.findMany({
          where: { id: { in: businessIds } },
          select: { id: true, name: true, activityType: true, planType: true }
        });
        return groups.map(g => ({
          businessId: g.businessId,
          businessName: businesses.find(b => b.id === g.businessId)?.name || 'Unknown',
          activityType: businesses.find(b => b.id === g.businessId)?.activityType || 'OTHER',
          planType: businesses.find(b => b.id === g.businessId)?.planType || 'TRIAL',
          count: g._count.id
        }));
      }),
      prisma.business.count({ where: { crmLeadCollectionEnabled: true } }),
      prisma.business.count({ where: { preChatFormEnabled: true } })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalLeads,
          businessesWithCrm,
          businessesWithPreChat
        },
        bySource: leadsBySource.reduce((acc, item) => {
          acc[item.source] = item._count.id;
          return acc;
        }, {}),
        byBusiness: leadsByBusiness
      }
    });
  })
);

/**
 * @route   DELETE /api/admin/crm/leads/:id
 * @desc    Delete CRM lead (Super Admin can delete any lead)
 * @access  SUPERADMIN
 */
router.delete(
  '/leads/:id',
  requirePermission('system:delete'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.crmLead.delete({
      where: { id }
    });

    logger.warn(`Super Admin ${req.user.email} deleted CRM lead ${id}`);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  })
);

/**
 * @route   POST /api/admin/crm/leads/bulk-delete
 * @desc    Bulk delete CRM leads
 * @access  SUPERADMIN
 */
router.post(
  '/leads/bulk-delete',
  requirePermission('system:delete'),
  asyncHandler(async (req, res) => {
    const { leadIds } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'leadIds array is required'
      });
    }

    const result = await prisma.crmLead.deleteMany({
      where: {
        id: { in: leadIds }
      }
    });

    logger.warn(`Super Admin ${req.user.email} bulk deleted ${result.count} CRM leads`);

    res.json({
      success: true,
      message: `Deleted ${result.count} leads`,
      count: result.count
    });
  })
);

module.exports = router;

