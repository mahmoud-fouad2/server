const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// Enhanced authenticateToken: verifies JWT and ensures req.user.businessId
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // SECURITY: Token verification - no logging of sensitive data in production
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // Attach basic user payload
    req.user = verified || {};

    // If token doesn't include businessId, try to look it up from DB
    if (!req.user.businessId && (req.user.userId || req.user.email)) {
      try {
        let dbUser = null;
        if (req.user.userId) {
          dbUser = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { businesses: true } });
        } else if (req.user.email) {
          dbUser = await prisma.user.findUnique({ where: { email: req.user.email }, include: { businesses: true } });
        }
        if (dbUser && dbUser.businesses && dbUser.businesses.length > 0) {
          req.user.businessId = dbUser.businesses[0].id;
        }
      } catch (e) {
        console.warn('authenticateToken: failed to lookup businessId', e?.message || e);
      }
    }

    next();
  } catch (error) {
    console.error('[auth] token verify failed:', error && (error.message || error));
    res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticateToken, requireRole };
