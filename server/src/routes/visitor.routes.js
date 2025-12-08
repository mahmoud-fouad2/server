const express = require('express');
const router = express.Router();
const visitorService = require('../services/visitor.service');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Visitor Routes - Track sessions, page visits, and user analytics
 * Last updated: 2024-12-04
 * 
 * POST /api/visitor/session
 * إنشاء أو استرجاع جلسة زائر
 */
router.post('/session', async (req, res) => {
  try {
    const { businessId, fingerprint } = req.body;

    if (!businessId || !fingerprint) {
      return res.status(400).json({ 
        success: false, 
        message: 'businessId and fingerprint are required' 
      });
    }

    const session = await visitorService.getOrCreateSession(businessId, fingerprint, req);

    res.json({
      success: true,
      session: {
        id: session.id,
        fingerprint: session.fingerprint,
        country: session.country,
        device: session.device,
        pageViews: session.pageViews,
        lastConversationId: session.conversations[0]?.id || null
      }
    });
  } catch (error) {
    logger.error('Visitor session endpoint error', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/visitor/page-visit
 * تسجيل زيارة صفحة
 */
router.post('/page-visit', async (req, res) => {
  try {
    const { sessionId, url, title, path } = req.body;

    if (!sessionId || !url || !path) {
      return res.status(400).json({ 
        success: false, 
        message: 'sessionId, url, and path are required' 
      });
    }

    const visit = await visitorService.trackPageVisit(sessionId, { url, title, path });

    res.json({ success: true, visitId: visit.id });
  } catch (error) {
    logger.error('Page visit endpoint error', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PUT /api/visitor/page-visit/:id
 * تحديث بيانات زيارة صفحة (duration, scroll, clicks)
 */
router.put('/page-visit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, scrollDepth, clicks, exitedAt } = req.body;

    const visit = await visitorService.updatePageVisit(id, {
      duration,
      scrollDepth,
      clicks,
      exitedAt
    });

    res.json({ success: true, visit });
  } catch (error) {
    logger.error('Update page visit endpoint error', { visitId: req.params.id, error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/visitor/end-session
 * إنهاء جلسة
 */
router.post('/end-session', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const session = await visitorService.endSession(sessionId);

    res.json({ success: true, session });
  } catch (error) {
    logger.error('End session endpoint error', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/visitor/active-sessions
 * الحصول على الجلسات النشطة (محمي)
 */
router.get('/active-sessions', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.role === 'SUPERADMIN' 
      ? req.query.businessId 
      : (req.user.businessId || req.user.businesses?.[0]?.id);

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business not found' });
    }

    const sessions = await visitorService.getActiveSessions(businessId);

    res.json({ success: true, sessions });
  } catch (error) {
    logger.error('Active sessions endpoint error', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/visitor/analytics
 * إحصائيات الزوار (محمي)
 */
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.role === 'SUPERADMIN' 
      ? req.query.businessId 
      : (req.user.businessId || req.user.businesses?.[0]?.id);

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business not found' });
    }

    // Default: last 30 days
    const dateFrom = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.to ? new Date(req.query.to) : new Date();

    const analytics = await visitorService.getSessionAnalytics(businessId, dateFrom, dateTo);

    res.json({ success: true, analytics });
  } catch (error) {
    logger.error('Visitor analytics endpoint error', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/visitor/track-user
 * تسجيل نشاط مستخدم (محمي)
 */
router.post('/track-user', authenticateToken, async (req, res) => {
  try {
    const { action, metadata } = req.body;
    const businessId = req.user.businesses[0]?.id;

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business not found' });
    }

    const activity = await visitorService.trackUserActivity(
      businessId,
      req.user.id,
      action,
      metadata,
      req
    );

    res.json({ success: true, activity });
  } catch (error) {
    logger.error('Track user activity endpoint error', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/visitor/user-activities
 * الحصول على نشاطات المستخدمين (محمي - Admin only)
 */
router.get('/user-activities', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const businessId = req.query.businessId;
    if (!businessId) {
      return res.status(400).json({ success: false, message: 'businessId is required' });
    }

    const dateFrom = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.to ? new Date(req.query.to) : new Date();

    const activities = await visitorService.getUserActivities(businessId, dateFrom, dateTo);

    res.json({ success: true, activities });
  } catch (error) {
    logger.error('User activities endpoint error', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
