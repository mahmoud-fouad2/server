/**
 * Faheemly™ - Unified Authorization Middleware
 * Copyright © 2024-2025 Faheemly.com - All Rights Reserved
 * 
 * PROPRIETARY SOFTWARE - Unauthorized copying or distribution is prohibited.
 * 
 * Unified authorization system combining:
 * 1. Global RBAC (Role-Based Access Control) for system-wide permissions
 * 2. Team-Based permissions for business/workspace collaboration
 * 
 * @module middleware/authorization
 */

const prisma = require('../config/database');
const logger = require('../utils/logger');

// ============================================================================
// GLOBAL RBAC PERMISSIONS
// ============================================================================

/**
 * System-wide role permissions
 * USER < ADMIN < SUPERADMIN
 */
const GLOBAL_PERMISSIONS = {
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
    'settings:update'
  ],
  SUPERADMIN: [
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

// ============================================================================
// TEAM-BASED PERMISSIONS
// ============================================================================

/**
 * Team role permissions for business collaboration
 * VIEWER < AGENT < MANAGER < OWNER
 */
const TEAM_PERMISSIONS = {
  VIEW_CONVERSATIONS: 'view_conversations',
  REPLY_CONVERSATIONS: 'reply_conversations',
  DELETE_CONVERSATIONS: 'delete_conversations',
  VIEW_KNOWLEDGE: 'view_knowledge',
  EDIT_KNOWLEDGE: 'edit_knowledge',
  DELETE_KNOWLEDGE: 'delete_knowledge',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_TEAM: 'manage_team',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_BILLING: 'manage_billing'
};

const TEAM_ROLES = {
  OWNER: {
    name: 'Owner',
    permissions: Object.values(TEAM_PERMISSIONS)
  },
  MANAGER: {
    name: 'Manager',
    permissions: [
      TEAM_PERMISSIONS.VIEW_CONVERSATIONS,
      TEAM_PERMISSIONS.REPLY_CONVERSATIONS,
      TEAM_PERMISSIONS.VIEW_KNOWLEDGE,
      TEAM_PERMISSIONS.EDIT_KNOWLEDGE,
      TEAM_PERMISSIONS.VIEW_ANALYTICS,
      TEAM_PERMISSIONS.MANAGE_TEAM
    ]
  },
  AGENT: {
    name: 'Agent',
    permissions: [
      TEAM_PERMISSIONS.VIEW_CONVERSATIONS,
      TEAM_PERMISSIONS.REPLY_CONVERSATIONS,
      TEAM_PERMISSIONS.VIEW_KNOWLEDGE
    ]
  },
  VIEWER: {
    name: 'Viewer',
    permissions: [
      TEAM_PERMISSIONS.VIEW_CONVERSATIONS,
      TEAM_PERMISSIONS.VIEW_KNOWLEDGE,
      TEAM_PERMISSIONS.VIEW_ANALYTICS
    ]
  }
};

// ============================================================================
// GLOBAL RBAC MIDDLEWARE
// ============================================================================

/**
 * Check if user has required global permission
 * @param {string} requiredPermission - Permission to check (e.g., 'users:read')
 * @returns {Function} Express middleware
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
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

      const userRole = req.user.role || 'USER';
      
      if (!GLOBAL_PERMISSIONS[userRole]) {
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

      const userPermissions = GLOBAL_PERMISSIONS[userRole];
      
      if (!userPermissions.includes(requiredPermission)) {
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
 * Require specific global role
 * @param {string|array} roles - Required role(s) (e.g., 'SUPERADMIN' or ['ADMIN', 'SUPERADMIN'])
 * @returns {Function} Express middleware
 */
const requireRole = (roles) => {
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

// ============================================================================
// TEAM-BASED MIDDLEWARE
// ============================================================================

/**
 * Check if user has required team permission for a business
 * @param {string} permission - Team permission to check (e.g., 'view_conversations')
 * @returns {Function} Express middleware
 */
const requireTeamPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const businessId = req.params.businessId || req.body.businessId || req.user?.businessId;
      const userId = req.user?.userId || req.user?.id;

      if (!businessId) {
        return res.status(400).json({ 
          success: false,
          error: 'Business ID required' 
        });
      }

      if (!userId) {
        return res.status(401).json({ 
          success: false,
          error: 'Authentication required' 
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          businesses: { where: { id: businessId } }
        }
      });

      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      let userPermissions;
      
      // Check if user is business owner
      if (user.businesses.length > 0) {
        userPermissions = TEAM_ROLES.OWNER.permissions;
      } 
      // Check if user is employee
      else if (user.employerId === businessId) {
        const teamRole = user.role || 'AGENT';
        userPermissions = TEAM_ROLES[teamRole]?.permissions || [];
      } 
      // User not part of team
      else {
        logger.warn('Team permission denied: User not part of team', {
          userId,
          businessId,
          path: req.path
        });
        
        return res.status(403).json({ 
          success: false,
          error: 'Access denied: Not a team member' 
        });
      }

      if (!userPermissions.includes(permission)) {
        logger.warn('Team permission denied', {
          userId,
          businessId,
          permission,
          path: req.path
        });
        
        return res.status(403).json({ 
          success: false,
          error: 'Insufficient team permissions',
          required: permission 
        });
      }

      next();
      
    } catch (error) {
      logger.error('Team permission check error', {
        error: error.message,
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
 * Require specific team role
 * @param {string|array} roles - Required team role(s) (e.g., 'OWNER' or ['OWNER', 'MANAGER'])
 * @returns {Function} Express middleware
 */
const requireTeamRole = (roles) => {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return async (req, res, next) => {
    try {
      const businessId = req.params.businessId || req.body.businessId;
      const userId = req.user?.userId || req.user?.id;

      if (!businessId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'Business ID and user ID required' 
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          businesses: { where: { id: businessId } }
        }
      });

      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      let userRole;
      
      if (user.businesses.length > 0) {
        userRole = 'OWNER';
      } else if (user.employerId === businessId) {
        userRole = user.role || 'AGENT';
      } else {
        return res.status(403).json({ 
          success: false,
          error: 'Not a team member' 
        });
      }

      if (!requiredRoles.includes(userRole)) {
        logger.warn('Team role requirement not met', {
          userId,
          businessId,
          userRole,
          requiredRoles,
          path: req.path
        });
        
        return res.status(403).json({ 
          success: false,
          error: 'Insufficient team privileges',
          required: requiredRoles,
          userRole 
        });
      }

      next();
      
    } catch (error) {
      logger.error('Team role check error', {
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

// ============================================================================
// RESOURCE OWNERSHIP
// ============================================================================

/**
 * Check if user owns the resource or is SUPERADMIN
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

      // SUPERADMIN bypasses ownership checks
      if (req.user.role === 'SUPERADMIN') {
        return next();
      }

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
    const targetUserId = req.params.id || req.params.userId;
    const currentUserId = req.user?.userId || req.user?.id;

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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all global permissions for a role
 * @param {string} role - User role
 * @returns {array} Array of permissions
 */
const getPermissionsForRole = (role) => {
  return GLOBAL_PERMISSIONS[role] || [];
};

/**
 * Get all team permissions for a role
 * @param {string} role - Team role
 * @returns {array} Array of permissions
 */
const getTeamPermissionsForRole = (role) => {
  return TEAM_ROLES[role]?.permissions || [];
};

/**
 * Check if global role has permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
const roleHasPermission = (role, permission) => {
  const permissions = GLOBAL_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if team role has permission
 * @param {string} role - Team role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if role has permission
 */
const teamRoleHasPermission = (role, permission) => {
  const permissions = TEAM_ROLES[role]?.permissions || [];
  return permissions.includes(permission);
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Global RBAC
  requirePermission,
  requireRole,
  getPermissionsForRole,
  roleHasPermission,
  GLOBAL_PERMISSIONS,
  
  // Team-Based
  requireTeamPermission,
  requireTeamRole,
  getTeamPermissionsForRole,
  teamRoleHasPermission,
  TEAM_PERMISSIONS,
  TEAM_ROLES,
  
  // Resource Control
  requireOwnership,
  preventSelfAction
};
