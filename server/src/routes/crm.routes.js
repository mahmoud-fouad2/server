const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const crmService = require('../services/crm.service');
const prisma = require('../config/database');
const logger = require('../utils/logger');

// Get CRM leads for business
router.get('/leads', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { page, limit, search, startDate, endDate } = req.query;

    const result = await crmService.getLeads(businessId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search,
      startDate,
      endDate
    });

    res.json(result);
  } catch (error) {
    logger.error('CRM leads fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch CRM leads' });
  }
});

// Export CRM leads to CSV
router.get('/leads/export', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { search, startDate, endDate } = req.query;

    const { headers, data } = await crmService.exportLeads(businessId, {
      search,
      startDate,
      endDate
    });

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="crm-leads.csv"');
    res.send(csvContent);
  } catch (error) {
    logger.error('CRM export error:', error);
    res.status(500).json({ error: 'Failed to export CRM leads' });
  }
});

// Create manual CRM lead
router.post('/leads', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { name, email, phone, requestSummary } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const lead = await crmService.createLead(businessId, {
      name,
      email,
      phone,
      requestSummary,
      source: 'MANUAL_ENTRY'
    });

    res.json({ message: 'Lead created successfully', lead });
  } catch (error) {
    logger.error('CRM lead creation error:', error);
    res.status(500).json({ error: 'Failed to create CRM lead' });
  }
});

// Get CRM status for business
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const isEnabled = await crmService.isCrmEnabled(businessId);

    res.json({
      crmEnabled: isEnabled,
      message: isEnabled ? 'CRM is enabled' : 'CRM is disabled - contact support to enable'
    });
  } catch (error) {
    logger.error('CRM status check error:', error);
    res.status(500).json({ error: 'Failed to check CRM status' });
  }
});

// Get CRM statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const stats = await crmService.getCrmStats(businessId, { startDate, endDate });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('CRM stats error:', error);
    res.status(500).json({ error: 'Failed to fetch CRM stats' });
  }
});

// Get lead by ID
router.get('/leads/:id', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;

    const lead = await crmService.getLeadById(businessId, id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    logger.error('CRM lead fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// Update lead
router.put('/leads/:id', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { name, email, phone, requestSummary } = req.body;

    const lead = await prisma.crmLead.findFirst({
      where: { id, businessId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updatedLead = await prisma.crmLead.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(requestSummary !== undefined && { requestSummary })
      }
    });

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: updatedLead
    });
  } catch (error) {
    logger.error('CRM lead update error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Add a note to a lead
router.post('/leads/:id/notes', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') return res.status(400).json({ error: 'Message required' });

    const note = await crmService.addNote(businessId, id, req.user.id, message);

    res.json({ success: true, data: note });
  } catch (error) {
    logger.error('CRM add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Get notes for a lead
router.get('/leads/:id/notes', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;

    const notes = await crmService.getNotes(businessId, id);

    res.json({ success: true, data: notes });
  } catch (error) {
    logger.error('CRM get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Assign a lead to an agent
router.put('/leads/:id/assign', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { userId } = req.body;

    const updated = await crmService.assignLead(businessId, id, userId);

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('CRM assign error:', error);
    res.status(500).json({ error: 'Failed to assign lead' });
  }
});

// Update lead status
router.put('/leads/:id/status', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { status } = req.body;

    const updated = await crmService.updateStatus(businessId, id, status);

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('CRM status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete lead
router.delete('/leads/:id', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;

    await crmService.deleteLead(businessId, id);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    logger.error('CRM lead delete error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// Bulk update leads
router.post('/leads/bulk-update', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { leadIds, updates } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: 'leadIds array is required' });
    }

    const result = await crmService.bulkUpdateLeads(businessId, leadIds, updates);

    res.json({
      success: true,
      message: `Updated ${result.count} leads`,
      count: result.count
    });
  } catch (error) {
    logger.error('CRM bulk update error:', error);
    res.status(500).json({ error: 'Failed to bulk update leads' });
  }
});

// Super Admin: Toggle CRM for a business
router.post('/toggle/:businessId', authenticateToken, async (req, res) => {
  try {
    // Check if user is Super Admin
    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Only Super Admin can toggle CRM' });
    }

    const { businessId } = req.params;
    const { enabled } = req.body;

    const business = await prisma.business.update({
      where: { id: businessId },
      data: { crmLeadCollectionEnabled: enabled }
    });

    logger.info(`Super Admin ${req.user.email} ${enabled ? 'enabled' : 'disabled'} CRM for business ${businessId}`);

    res.json({
      success: true,
      message: `CRM ${enabled ? 'enabled' : 'disabled'} for business`,
      data: { 
        id: business.id, 
        name: business.name, 
        crmLeadCollectionEnabled: business.crmLeadCollectionEnabled 
      }
    });
  } catch (error) {
    logger.error('CRM toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle CRM' });
  }
});

// Super Admin: Get all CRM leads across all businesses
router.get('/admin/leads', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Only Super Admin can access this endpoint' });
    }

    const { page = 1, limit = 50, businessId, search, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(businessId && { businessId }),
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
              activityType: true
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
  } catch (error) {
    logger.error('Admin CRM leads fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch CRM leads' });
  }
});

// Super Admin: Get CRM statistics across all businesses
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Only Super Admin can access this endpoint' });
    }

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
      leadsByDay
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
          select: { id: true, name: true, activityType: true }
        });
        return groups.map(g => ({
          businessId: g.businessId,
          businessName: businesses.find(b => b.id === g.businessId)?.name || 'Unknown',
          activityType: businesses.find(b => b.id === g.businessId)?.activityType || 'OTHER',
          count: g._count.id
        }));
      }),
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*)::int as count
        FROM "crm_leads"
        WHERE 1=1
          ${startDate ? prisma.$queryRaw`AND "createdAt" >= ${new Date(startDate)}` : prisma.$queryRaw``}
          ${endDate ? prisma.$queryRaw`AND "createdAt" <= ${new Date(endDate)}` : prisma.$queryRaw``}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    res.json({
      success: true,
      data: {
        total: totalLeads,
        bySource: leadsBySource.reduce((acc, item) => {
          acc[item.source] = item._count.id;
          return acc;
        }, {}),
        byBusiness: leadsByBusiness,
        byDay: leadsByDay
      }
    });
  } catch (error) {
    logger.error('Admin CRM stats error:', error);
    res.status(500).json({ error: 'Failed to fetch CRM stats' });
  }
});

module.exports = router;