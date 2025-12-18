import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Middleware to resolve and attach businessId to req.user
 * Should be used after authenticateToken
 */
const resolveBusinessId = async (req, res, next) => {
  try {
    // 1) Honor direct header if provided (helps SPA clients)
    let headerBusinessId = req.headers && (req.headers['x-business-id'] || req.headers['x_business_id'] || req.headers['businessid']);
    if (headerBusinessId) {
      // Normalize header value: trim, remove surrounding quotes
      headerBusinessId = String(headerBusinessId).trim().replace(/^\"|\"$|^\'|\'$/g, '');

      // If header looks like a malformed Bearer/token, ignore and let auth middleware handle it
      if (/^Bearer\s+/i.test(headerBusinessId) || headerBusinessId.split('.').length === 3) {
        logger.warn('resolveBusinessId: header contains a token-like value, ignoring as business id', { headerBusinessId: headerBusinessId.slice(0, 24) });
      } else {
        // validate business exists
        const business = await prisma.business.findUnique({ where: { id: headerBusinessId } });
        if (business) {
          req.user = req.user || {};
          req.user.businessId = headerBusinessId;
          return next();
        }

        // If client provided a header business id but it's invalid and there is NO auth token,
        // return a clear 400 to the client so the issue is surfaced (helps widget clients).
        if (!req.headers || !req.headers.authorization) {
          logger.warn('resolveBusinessId: invalid business id provided in header and no auth present', { headerBusinessId });
          return res.status(400).json({ error: 'Invalid business id provided in header.' });
        }

        // If Authorization is present, ignore header and allow token-based resolution, but log once.
        logger.warn('resolveBusinessId: invalid business id provided in header, ignoring in favor of Authorization', { headerBusinessId });
      }
    }

    // 2) If businessId already exists in token, validate it exists and skip lookup
    if (req.user && req.user.businessId) {
      try {
        const business = await prisma.business.findUnique({ where: { id: req.user.businessId } });
        if (business) return next();
        // If the businessId in token is stale/invalid, fall through to lookup via user
      } catch (e) {
        // proceed to lookup below
      }
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

export { resolveBusinessId, requireBusinessId };
