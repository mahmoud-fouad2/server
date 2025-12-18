import express from 'express';
const router = express.Router();
import visitorService from '../services/visitor.service.js';
import attachBusinessId from '../middleware/attachBusinessId.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import prisma, { isPrismaConfigured, warnIfPrismaNotConfigured } from '../config/database.js';

/**
 * Visitor Routes - Track sessions, page visits, and user analytics
 * Last updated: 2024-12-04
 * 
 * POST /api/visitor/session
 * إنشاء أو استرجاع جلسة زائر
 */
router.post('/session', attachBusinessId, async (req, res) => {
  try {
    // Accept businessId from body, query, or header for widget clients
    const businessId = req.body.businessId || req.query.businessId || req.headers['x-business-id'] || req.headers['x_business_id'] || req.headers['businessid'];
    // Fingerprint may come from body or a cookie/header from the widget
    const fingerprint = req.body.fingerprint || req.headers['x-fingerprint'] || req.cookies?.fingerprint;

    if (!businessId || !fingerprint) {
      // Provide helpful debug hint to the client
      logger.debug('Visitor session missing parameters', { businessId: !!businessId, fingerprint: !!fingerprint });
      return res.status(400).json({ 
        success: false, 
        message: 'businessId and fingerprint are required. Provide in body, query or headers (x-business-id, x-fingerprint).' 
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
    logger.error('Visitor session endpoint error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/visitor/page-visit
 * تسجيل زيارة صفحة
 */
router.post('/page-visit', attachBusinessId, async (req, res) => {
  try {
    const sessionId = req.body.sessionId || req.headers['x-session-id'] || req.cookies?.sessionId;
    const { url, title, path } = req.body;

    if (!sessionId || !url || !path) {
      logger.debug('Page visit missing parameters', { sessionId: !!sessionId, url: !!url, path: !!path });
      return res.status(400).json({ 
        success: false, 
        message: 'sessionId (body/header), url, and path are required.' 
      });
    }

    const visit = await visitorService.trackPageVisit(sessionId, { url, title, path });

    res.json({ success: true, visitId: visit.id });
  } catch (error) {
    logger.error('Page visit endpoint error', error);
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

    if (!visit) {
      return res.status(404).json({ success: false, error: 'Page visit not found' });
    }

    res.json({ success: true, visit });
  } catch (error) {
    logger.error('Update page visit endpoint error', error, { visitId: req.params.id });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/visitor/end-session
 * إنهاء جلسة
 */
router.post('/end-session', attachBusinessId, async (req, res) => {
  try {
    const sessionId = req.body.sessionId || req.headers['x-session-id'] || req.cookies?.sessionId;

    if (!sessionId) {
      logger.debug('End session missing sessionId');
      return res.status(400).json({ success: false, message: 'sessionId is required (body or x-session-id header).' });
    }

    const session = await visitorService.endSession(sessionId);

    res.json({ success: true, session });
  } catch (error) {
    logger.error('End session endpoint error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/visitor/active-sessions
 * الحصول على الجلسات النشطة (محمي)
 */
router.get('/active-sessions', authenticateToken, async (req, res) => {
  try {
    // Determine business ID with proper null checks
    let businessId = req.query.businessId || req.user.businessId || (Array.isArray(req.user.businesses) && req.user.businesses.length > 0 ? req.user.businesses[0]?.id : null);

    if (!businessId) {
      // Also accept business id from headers for admin widgets
      const headerBusinessId = req.headers['x-business-id'] || req.headers['x_business_id'];
      if (headerBusinessId) businessId = headerBusinessId;
    }

    // Fallback: try DB lookup only if Prisma is configured
    if (!businessId) {
      if (!isPrismaConfigured()) {
        warnIfPrismaNotConfigured(logger);
      } else {
        try {
          const business = await prisma.business.findFirst({ where: { userId: req.user.userId } });
          businessId = business?.id;
        } catch (dbError) {
          logger.warn('Database not available for business lookup in active sessions', { error: dbError.message });
        }
      }
    }

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID is required or user has no associated business' });
    }

    const sessions = await visitorService.getActiveSessions(businessId);

    res.json({ success: true, sessions });
  } catch (error) {
    logger.error('Active sessions endpoint error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/visitor/analytics
 * إحصائيات الزوار (محمي)
 */
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    // Determine business ID with proper null checks
    let businessId = req.query.businessId || req.user.businessId || (Array.isArray(req.user.businesses) && req.user.businesses.length > 0 ? req.user.businesses[0]?.id : null);

    if (!businessId) {
      const headerBusinessId = req.headers['x-business-id'] || req.headers['x_business_id'];
      if (headerBusinessId) businessId = headerBusinessId;
    }

    // Fallback: try DB lookup only if Prisma is configured
    if (!businessId) {
      if (!isPrismaConfigured()) {
        warnIfPrismaNotConfigured(logger);
      } else {
        try {
          const business = await prisma.business.findFirst({ where: { userId: req.user.userId } });
          businessId = business?.id;
        } catch (dbError) {
          logger.warn('Database not available for business lookup in visitor analytics', { error: dbError.message });
        }
      }
    }

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID is required or user has no associated business' });
    }

    // Default: last 30 days
    const dateFrom = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = req.query.to ? new Date(req.query.to) : new Date();

    const analytics = await visitorService.getSessionAnalytics(businessId, dateFrom, dateTo);

    res.json({ success: true, analytics });
  } catch (error) {
    logger.error('Visitor analytics endpoint error', error);
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
    
    // Determine business ID with proper null checks (safer than direct array access)
    let businessId;
    if (req.user.businessId) {
      businessId = req.user.businessId;
    } else if (Array.isArray(req.user.businesses) && req.user.businesses.length > 0) {
      businessId = req.user.businesses[0]?.id;
    }

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'Business ID is required or user has no associated business' });
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
    logger.error('Track user activity endpoint error', error);
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
    logger.error('User activities endpoint error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
