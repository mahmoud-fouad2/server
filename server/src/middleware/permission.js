/**
 * Faheemly™ - Permission Middleware
 * Copyright © 2024-2025 Faheemly.com - All Rights Reserved
 * 
 * PROPRIETARY SOFTWARE - Unauthorized copying or distribution is prohibited.
 * 
 * Role-based access control (RBAC) middleware.
 * Checks user permissions before allowing access to protected routes.
 * 
 * @module middleware/permission
 */

const logger = require('../utils/logger');

/**
 * Permission map - defines what each role can do
 */
const PERMISSIONS = {
  USER: [
    'profile:read',
    'profile:update',
    'business:read',
    'business:create',
    'business:update',
    'conversations:read',
    'messages:read',
    'messages:create',
    'knowledge:read',
    'knowledge:create'
  ],
  ADMIN: [
    // All USER permissions
    'profile:read',
    'profile:update',
    'business:read',
    'business:create',
    'business:update',
    'business:delete',
    'conversations:read',
    'messages:read',
    'messages:create',
    'knowledge:read',
    'knowledge:create',
    'knowledge:update',
    'knowledge:delete',
    // Additional ADMIN permissions
    'analytics:read',
    'reports:read',
    'settings:read',
    'settings:update'
  ],
  SUPERADMIN: [
    // All ADMIN permissions
    'profile:read',
    'profile:update',
    'business:read',
    'business:create',
    'business:update',
    'business:delete',
    'conversations:read',
    'messages:read',
    'messages:create',
    'knowledge:read',
    'knowledge:create',
    'knowledge:update',
    'knowledge:delete',
    'analytics:read',
    'reports:read',
    'settings:read',
    'settings:update',
    // SUPERADMIN exclusive permissions
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'system:read',
    'system:update',
    'system:delete',
    'audit:read',
    'roles:manage'
  ]
};

/**
 * Check if user has required permission
 * @param {string} requiredPermission - Permission to check (e.g., 'users:read')
 * @returns {Function} Express middleware
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        logger.warn('Permission check failed: No authenticated user', {
          path: req.path,
          method: req.method
        });
        
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Get user role
      const userRole = req.user.role || 'USER';
      
      // Check if role exists in permissions map
      if (!PERMISSIONS[userRole]) {
        logger.error('Permission check failed: Invalid role', {
          userId: req.user.id,
          role: userRole,
          path: req.path
        });
        
        return res.status(403).json({
          success: false,
          error: 'Invalid user role'
        });
      }

      // Get user permissions
      const userPermissions = PERMISSIONS[userRole];
      
      // Check if user has required permission
      const hasPermission = userPermissions.includes(requiredPermission);
      
      if (!hasPermission) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          userRole,
          requiredPermission,
          path: req.path,
          method: req.method
        });
        
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: requiredPermission,
          userRole
        });
      }

      // Permission granted
      logger.debug('Permission granted', {
        userId: req.user.id,
        userRole,
        permission: requiredPermission,
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

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {array} Array of permissions
 */
const getPermissionsForRole = (role) => {
  return PERMISSIONS[role] || [];
};

/**
 * Check if role has permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
const roleHasPermission = (role, permission) => {
  const permissions = PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

module.exports = {
  requirePermission,
  requireRole,
  requireOwnership,
  preventSelfAction,
  getPermissionsForRole,
  roleHasPermission,
  PERMISSIONS
};
