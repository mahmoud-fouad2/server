const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware to resolve and attach businessId to req.user
 * Should be used after authenticateToken
 */
const resolveBusinessId = async (req, res, next) => {
  try {
    // 1) Honor direct header if provided (helps SPA clients)
    const headerBusinessId = req.headers && (req.headers['x-business-id'] || req.headers['x_business_id'] || req.headers['businessid']);
    if (headerBusinessId) {
      // validate business exists
      const business = await prisma.business.findUnique({ where: { id: headerBusinessId } });
      if (business) {
        req.user = req.user || {};
        req.user.businessId = headerBusinessId;
        return next();
      }
      return res.status(400).json({ error: 'Invalid business id provided in request header.' });
    }

    // 2) If businessId already exists in token, skip lookup
    if (req.user && req.user.businessId) {
      return next();
    }

    // 3) Allow businessId via query param as a fallback (public widget usage)
    const queryBusinessId = req.query && (req.query.businessId || req.query.business_id);
    if (queryBusinessId) {
      const business = await prisma.business.findUnique({ where: { id: queryBusinessId } });
      if (business) {
        req.user = req.user || {};
        req.user.businessId = queryBusinessId;
        return next();
      }
      return res.status(400).json({ error: 'Invalid business id provided in query param.' });
    }

    // 4) If no user object or lacking identifiers, token verification failed upstream
    if (!req.user || (!req.user.userId && !req.user.email)) {
      return res.status(400).json({ error: 'Business ID missing from token. Please re-login.' });
    }

    // 5) Lookup businessId from database using token identity
    let dbUser = null;
    if (req.user.userId) {
      dbUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { businesses: true }
      });
    } else if (req.user.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: req.user.email },
        include: { businesses: true }
      });
    }

    if (!dbUser || !dbUser.businesses || dbUser.businesses.length === 0) {
      return res.status(400).json({ error: 'No business found for this user. Please contact support.' });
    }

    // Attach businessId to req.user
    req.user.businessId = dbUser.businesses[0].id;
    next();
  } catch (error) {
    logger.error('resolveBusinessId middleware error:', error);
    res.status(500).json({ error: 'Failed to resolve business' });
  }
};

/**
 * Middleware to require businessId in req.user
 * Returns 400 if missing
 */
const requireBusinessId = (req, res, next) => {
  if (!req.user || !req.user.businessId) {
    return res.status(400).json({ error: 'Business ID required. Please re-login.' });
  }
  next();
};

module.exports = {
  resolveBusinessId,
  requireBusinessId
};
