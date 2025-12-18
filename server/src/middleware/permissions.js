import express from 'express';
const router = express.Router();
import prisma from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

/**
 * Team Permissions & Role Management
 * Fine-grained access control for business teams
 */

// Permission types
const PERMISSIONS = {
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

// Predefined roles
const ROLES = {
  OWNER: {
    name: 'Owner',
    permissions: Object.values(PERMISSIONS) // All permissions
  },
  MANAGER: {
    name: 'Manager',
    permissions: [
      PERMISSIONS.VIEW_CONVERSATIONS,
      PERMISSIONS.REPLY_CONVERSATIONS,
      PERMISSIONS.VIEW_KNOWLEDGE,
      PERMISSIONS.EDIT_KNOWLEDGE,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.MANAGE_TEAM
    ]
  },
  AGENT: {
    name: 'Agent',
    permissions: [
      PERMISSIONS.VIEW_CONVERSATIONS,
      PERMISSIONS.REPLY_CONVERSATIONS,
      PERMISSIONS.VIEW_KNOWLEDGE
    ]
  },
  VIEWER: {
    name: 'Viewer',
    permissions: [
      PERMISSIONS.VIEW_CONVERSATIONS,
      PERMISSIONS.VIEW_KNOWLEDGE,
      PERMISSIONS.VIEW_ANALYTICS
    ]
  }
};

// Get team member permissions
router.get('/permissions/:businessId/:userId', authenticateToken, async (req, res) => {
  try {
    const { businessId, userId } = req.params;

    // Check if requester has permission to view team
    const requester = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        businesses: { where: { id: businessId } }
      }
    });

    if (!requester || (!requester.businesses.length && requester.employerId !== businessId)) {
      return res.status(403).json({ error: 'غير مصرح' });
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        businesses: { where: { id: businessId } }
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // Determine role and permissions
    let role, permissions;
    
    if (targetUser.businesses.length > 0) {
      // User is business owner
      role = 'OWNER';
      permissions = ROLES.OWNER.permissions;
    } else if (targetUser.employerId === businessId) {
      // User is employee - check role
      role = targetUser.role;
      permissions = ROLES[role]?.permissions || ROLES.AGENT.permissions;
    } else {
      return res.status(403).json({ error: 'المستخدم ليس جزءاً من هذا الفريق' });
    }

    res.json({
      userId: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role,
      permissions
    });

  } catch (error) {
    logger.error('Get permissions error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'فشل جلب الصلاحيات' });
  }
});

// Update team member role
router.put('/role/:businessId/:userId', authenticateToken, async (req, res) => {
  try {
    const { businessId, userId } = req.params;
    const { role } = req.body;

    if (!['MANAGER', 'AGENT', 'VIEWER'].includes(role)) {
      return res.status(400).json({ error: 'دور غير صالح' });
    }

    // Verify requester is business owner
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        userId: req.user.userId
      }
    });

    if (!business) {
      return res.status(403).json({ error: 'فقط صاحب العمل يمكنه تغيير الأدوار' });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    // Log activity
    await logActivity({
      businessId,
      userId: req.user.userId,
      action: 'role_updated',
      targetUserId: userId,
      details: { newRole: role }
    });

    res.json({
      message: 'تم تحديث الدور بنجاح',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        permissions: ROLES[role].permissions
      }
    });

  } catch (error) {
    logger.error('Update role error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'فشل تحديث الدور' });
  }
});

// Get activity logs
router.get('/activity-logs/:businessId', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify access
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        userId: req.user.userId
      }
    });

    if (!business) {
      return res.status(403).json({ error: 'غير مصرح' });
    }

    // Get logs from ActivityLog table (need to create this)
    // For now, return recent team changes
    const recentChanges = await prisma.user.findMany({
      where: { employerId: businessId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({
      logs: recentChanges.map(user => ({
        timestamp: user.updatedAt,
        userId: user.id,
        userEmail: user.email,
        action: 'User role/status updated',
        role: user.role
      }))
    });

  } catch (error) {
    logger.error('Activity logs error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'فشل جلب سجل النشاطات' });
  }
});

// Check permission middleware (to be used in other routes)
function hasPermission(permission) {
  return async (req, res, next) => {
    try {
      const { businessId } = req.params;
      const userId = req.user.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          businesses: { where: { id: businessId } }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }

      let userPermissions;
      if (user.businesses.length > 0) {
        // Owner has all permissions
        userPermissions = ROLES.OWNER.permissions;
      } else if (user.employerId === businessId) {
        userPermissions = ROLES[user.role]?.permissions || [];
      } else {
        return res.status(403).json({ error: 'غير مصرح' });
      }

      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ 
          error: 'ليس لديك الصلاحية لتنفيذ هذا الإجراء',
          requiredPermission: permission 
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'فشل التحقق من الصلاحيات' });
    }
  };
}

// Activity logging helper
async function logActivity({ businessId, userId, action, targetUserId, details }) {
  try {
    logger.info('Team activity', {
      businessId,
      userId,
      action,
      targetUserId,
      details,
      timestamp: new Date()
    });
    
    // Future: Create ActivityLog table in schema for persistent storage
  } catch (error) {
    logger.error('Activity log error', { error: error.message });
  }
}

export default router;
export { hasPermission, PERMISSIONS };
