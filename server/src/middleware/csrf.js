const crypto = require('crypto');

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for state-changing operations
 */

const csrfStore = require('../services/csrfStore');
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate CSRF token
 */
const generateCSRFToken = async (req, res, next) => {
  const token = crypto.randomBytes(32).toString('hex');

  // Store token with session/user identifier
  const sessionId = req.user?.id || req.ip || 'anonymous';
  await csrfStore.set(sessionId, token, TOKEN_EXPIRY);

  // Clean up expired tokens periodically (only affects in-memory fallback)
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupExpiredTokens();
  }

  res.setHeader('X-CSRF-Token', token);
  next();
};

/**
 * Validate CSRF token
 */
const validateCSRFToken = async (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body?._csrf;
  const sessionId = req.user?.id || req.ip || 'anonymous';

  if (!token) {
    return res.status(403).json({
      error: 'CSRF token missing',
      message: 'Request must include CSRF token'
    });
  }

  const exists = await csrfStore.get(sessionId, token);
  if (!exists) {
    return res.status(403).json({
      error: 'CSRF token invalid or expired',
      message: 'Please refresh and try again'
    });
  }

  // Token used, remove it (one-time use)
  await csrfStore.delete(sessionId, token);

  next();
};

/**
 * Cleanup expired tokens
 */
function cleanupExpiredTokens() {
  // Only applicable when the fallback in-memory store is used
  if (csrfStore && csrfStore.store && csrfStore.store instanceof Map) {
    const now = Date.now();
    for (const [key, expiry] of csrfStore.store.entries()) {
      if (now > expiry) {
        csrfStore.store.delete(key);
      }
    }
  }
}

module.exports = {
  generateCSRFToken,
  validateCSRFToken
};