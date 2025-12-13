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

    res.json({
      message: `CRM ${enabled ? 'enabled' : 'disabled'} for business`,
      business: { id: business.id, name: business.name, crmLeadCollectionEnabled: business.crmLeadCollectionEnabled }
    });
  } catch (error) {
    logger.error('CRM toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle CRM' });
  }
});

module.exports = router;