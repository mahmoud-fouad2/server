/**
 * Faheemly™ - Permission Middleware (Legacy Wrapper)
 * Copyright © 2024-2025 Faheemly.com - All Rights Reserved
 * 
 * PROPRIETARY SOFTWARE - Unauthorized copying or distribution is prohibited.
 * 
 * DEPRECATED: This file is a legacy wrapper around the unified authorization system.
 * New code should use middleware/authorization.js directly.
 * 
 * This file maintains backward compatibility for existing routes.
 * 
 * @module middleware/permission
 * @deprecated Use middleware/authorization.js instead
 */

const logger = require('../utils/logger');
const { requirePermission: requirePermissionUnified } = require('./authorization');

/**
 * Check if user has required permission
 * @param {string} requiredPermission - Permission to check (e.g., 'users:read')
 * @returns {Function} Express middleware
 * @deprecated Use requirePermission from middleware/authorization.js
 */
const requirePermission = (requiredPermission) => {
  logger.warn('Using deprecated permission middleware. Migrate to middleware/authorization.js', {
    permission: requiredPermission,
    path: 'middleware/permission.js'
  });
  
  // Delegate to unified authorization system
  return requirePermissionUnified(requiredPermission);
        path: req.path
      });
      
      next();
      
    } catch (error) {
      logger.error('Permission middleware error', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        path: req.path
      });
      
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

/**
 * Require specific role
 * @param {string|array} roles - Required role(s) (e.g., 'SUPERADMIN' or ['ADMIN', 'SUPERADMIN'])
 * @returns {Function} Express middleware
 */
const requireRole = (roles) => {
  // Convert single role to array
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userRole = req.user.role || 'USER';
      
      if (!requiredRoles.includes(userRole)) {
        logger.warn('Role requirement not met', {
          userId: req.user.id,
          userRole,
          requiredRoles,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          error: 'Insufficient privileges',
          required: requiredRoles,
          userRole
        });
      }

      next();
      
    } catch (error) {
      logger.error('Role middleware error', {
        error: error.message,
        userId: req.user?.id,
        path: req.path
      });
      
      return res.status(500).json({
        success: false,
        error: 'Role check failed'
      });
    }
  };
};

/**
 * Check if user can access specific resource
 * @param {Function} resourceOwnerCheck - Function to determine if user owns resource
 * @returns {Function} Express middleware
 */
const requireOwnership = (resourceOwnerCheck) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // SUPERADMIN can access everything
      if (req.user.role === 'SUPERADMIN') {
        return next();
      }

      // Check ownership
      const isOwner = await resourceOwnerCheck(req);
      
      if (!isOwner) {
        logger.warn('Resource access denied: Not owner', {
          userId: req.user.id,
          path: req.path,
          method: req.method
        });
        
        return res.status(403).json({
          success: false,
          error: 'Access denied: You do not own this resource'
        });
      }

      next();
      
    } catch (error) {
      logger.error('Ownership middleware error', {
        error: error.message,
        userId: req.user?.id,
        path: req.path
      });
      
      return res.status(500).json({
        success: false,
        error: 'Ownership check failed'
      });
    }
  };
};

/**
 * Prevent user from performing action on themselves
 * (e.g., deleting own account, deactivating self)
 */
const preventSelfAction = (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user?.id;

    if (targetUserId === currentUserId) {
      logger.warn('Self-action prevented', {
        userId: currentUserId,
        action: req.method,
        path: req.path
      });
      
      return res.status(400).json({
        success: false,
        error: 'Cannot perform this action on yourself'
      });
    }

    next();
    
  } catch (error) {
    logger.error('Self-action prevention error', {
      error: error.message,
      userId: req.user?.id,
      path: req.path
    });
    
    return res.status(500).json({
      success: false,
      error: 'Action validation failed'
    });
  }
};

// Re-export from unified authorization system
const { requireRole: requireRoleUnified, GLOBAL_PERMISSIONS } = require('./authorization');

/**
 * Require specific role (delegates to unified system)
 * @deprecated Use requireRole from middleware/authorization.js
 */
const requireRole = requireRoleUnified;

/**
 * Get all permissions for a role (from unified system)
 * @param {string} role - User role
 * @returns {array} Array of permissions
 */
const getPermissionsForRole = (role) => {
  return GLOBAL_PERMISSIONS[role] || [];
};

/**
 * Check if role has permission (from unified system)
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
const roleHasPermission = (role, permission) => {
  const permissions = GLOBAL_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

module.exports = {
  requirePermission,
  requireRole,
  requireOwnership,
  preventSelfAction,
  getPermissionsForRole,
  roleHasPermission,
  PERMISSIONS: GLOBAL_PERMISSIONS // Export unified permissions
};
