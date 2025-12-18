/**
 * Middleware: attachBusinessId
 * If a header or query param contains a business id, attach it to req.user.businessId
 * This is a non-authoritative helper for public/widget endpoints to reduce 400s.
 */
import logger from '../utils/logger.js';

const attachBusinessId = (req, res, next) => {
  try {
    const headerBusinessId = req.headers['x-business-id'] || req.headers['x_business_id'] || req.query.businessId || req.query.business_id;
    if (headerBusinessId) {
      req.user = req.user || {};
      req.user.businessId = String(headerBusinessId).trim();
      logger.debug('attachBusinessId: attached businessId from header/query', { headerBusinessId: req.user.businessId.slice(0, 24) });
    }
  } catch (e) {
    logger.debug('attachBusinessId: failed to attach businessId', { error: e?.message || e });
  }
  next();
};

export default attachBusinessId;
