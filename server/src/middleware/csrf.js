const crypto = require('crypto');

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for state-changing operations
 */

// In-memory store for CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map();
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate CSRF token
 */
const generateCSRFToken = (req, res, next) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + TOKEN_EXPIRY;

  // Store token with session/user identifier
  const sessionId = req.user?.id || req.ip || 'anonymous';
  csrfTokens.set(`${sessionId}:${token}`, expiry);

  // Clean up expired tokens periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupExpiredTokens();
  }

  res.setHeader('X-CSRF-Token', token);
  next();
};

/**
 * Validate CSRF token
 */
const validateCSRFToken = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body?._csrf;
  const sessionId = req.user?.id || req.ip || 'anonymous';
  const tokenKey = `${sessionId}:${token}`;

  if (!token) {
    return res.status(403).json({
      error: 'CSRF token missing',
      message: 'Request must include CSRF token'
    });
  }

  const expiry = csrfTokens.get(tokenKey);
  if (!expiry || Date.now() > expiry) {
    return res.status(403).json({
      error: 'CSRF token invalid or expired',
      message: 'Please refresh and try again'
    });
  }

  // Token used, remove it (one-time use)
  csrfTokens.delete(tokenKey);

  next();
};

/**
 * Cleanup expired tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [key, expiry] of csrfTokens.entries()) {
    if (now > expiry) {
      csrfTokens.delete(key);
    }
  }
}

module.exports = {
  generateCSRFToken,
  validateCSRFToken
};