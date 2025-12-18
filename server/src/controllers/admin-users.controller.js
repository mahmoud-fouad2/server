/**
 * Admin User Management Controller
 * Full CRUD operations for user management with audit logging
 * 
 * @requires express-async-handler
 * @requires bcrypt
 * @requires prisma
 */

import asyncHandler from 'express-async-handler';
import adminUserService from '../services/admin-users.service.js';
import logger from '../utils/logger.js';
import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';

/**
 * @desc    Get all users with pagination, filtering, and search
 * @route   GET /api/admin/users
 * @access  Private (SUPERADMIN only)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await adminUserService.getAllUsers(req.query);
  res.json(result);
});

/**
 * @desc    Get single user by ID with full details
 * @route   GET /api/admin/users/:id
 * @access  Private (SUPERADMIN only)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await adminUserService.getUserById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Remove sensitive data
  delete user.password;
  delete user.twoFactorSecret;
  delete user.resetToken;

  res.json(user);
});

/**
 * @desc    Create new user
 * @route   POST /api/admin/users
 * @access  Private (SUPERADMIN only)
 */
export const createUser = asyncHandler(async (req, res) => {
  const { email, password, name, role = 'CLIENT' } = req.body;

  // Validate input
  if (!email || !password || !name) {
    res.status(400);
    throw new Error('Email, password, and name are required');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      changes: {
        after: { email, name, role }
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.info(`Admin ${req.user.email} created new user ${email}`);

  res.status(201).json({
    message: 'User created successfully',
    user
  });
});

/**
 * @desc    Update user details
 * @route   PUT /api/admin/users/:id
 * @access  Private (SUPERADMIN only)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, name, role, isActive } = req.body;

  // Get current user data
  const currentUser = await prisma.user.findUnique({
    where: { id },
    select: { email: true, name: true, role: true, isActive: true }
  });

  if (!currentUser) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent self-demotion from SUPERADMIN
  if (id === req.user.id && role && role !== 'SUPERADMIN') {
    res.status(403);
    throw new Error('You cannot change your own role');
  }

  // Build update data
  const updateData = {};
  if (email !== undefined) updateData.email = email;
  if (name !== undefined) updateData.name = name;
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      changes: {
        before: currentUser,
        after: updateData
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.info(`Admin ${req.user.email} updated user ${id}`, { changes: updateData });

  res.json({
    message: 'User updated successfully',
    user: updatedUser
  });
});

/**
 * @desc    Change user password (admin-initiated)
 * @route   PUT /api/admin/users/:id/password
 * @access  Private (SUPERADMIN only)
 */
export const changeUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true }
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id },
    data: { 
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: id,
      changes: {
        message: 'Admin-initiated password change'
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.warn(`Admin ${req.user.email} changed password for user ${user.email}`);

  res.json({
    message: 'Password changed successfully'
  });
});

/**
 * @desc    Toggle user active status
 * @route   PUT /api/admin/users/:id/status
 * @access  Private (SUPERADMIN only)
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    res.status(400);
    throw new Error('isActive must be a boolean');
  }

  // Prevent self-deactivation
  if (id === req.user.id && !isActive) {
    res.status(403);
    throw new Error('You cannot deactivate your own account');
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      entity: 'User',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.info(`Admin ${req.user.email} ${isActive ? 'activated' : 'deactivated'} user ${user.email}`);

  res.json({
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    user
  });
});

/**
 * @desc    Soft delete user (can be restored within 30 days)
 * @route   DELETE /api/admin/users/:id
 * @access  Private (SUPERADMIN only)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, restoreUntil: restoreUntilRaw } = req.body || {};
  const restoreUntil = restoreUntilRaw ? new Date(restoreUntilRaw) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Prevent self-deletion
  if (id === req.user.id) {
    res.status(403);
    throw new Error('You cannot delete your own account');
  }

  // Get user data for backup
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      businesses: true,
      sessions: true
    }
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.isActive) {
    res.status(400);
    throw new Error('User is already inactive/deleted');
  }

  // Soft delete user by marking inactive and logging the deletion (no userDeletion table in schema)
  const deletedUser = await prisma.user.update({
    where: { id },
    data: {
      isActive: false
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
      changes: {
        reason,
        canRestore: true,
        restoreUntil
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.warn(`Admin ${req.user.email} deleted user ${user.email}`, { reason });

  res.json({
    message: 'User deactivated successfully (can be restored)',
    userId: deletedUser.id
  });
});

/**
 * @desc    Permanently delete user (cannot be restored)
 * @route   DELETE /api/admin/users/:id/permanent
 * @access  Private (SUPERADMIN only)
 */
export const hardDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { confirmation } = req.body;

  if (confirmation !== 'DELETE_PERMANENTLY') {
    res.status(400);
    throw new Error('Confirmation string must be "DELETE_PERMANENTLY"');
  }

  // Prevent self-deletion
  if (id === req.user.id) {
    res.status(403);
    throw new Error('You cannot delete your own account');
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, name: true }
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Delete user and all related data (cascade)
  await prisma.user.delete({
    where: { id }
  });

  // Create audit log (orphaned, user is deleted)
  logger.critical(`Admin ${req.user.email} PERMANENTLY deleted user ${user.email}`);

  res.json({
    message: 'User permanently deleted',
    email: user.email
  });
});

/**
 * @desc    Restore soft-deleted user
 * @route   POST /api/admin/users/:id/restore
 * @access  Private (SUPERADMIN only)
 */
export const restoreUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Restore user by re-activating the account
  const existingUser = await prisma.user.findUnique({ where: { id } });

  if (!existingUser) {
    res.status(404);
    throw new Error('User not found');
  }

  if (existingUser.isActive) {
    res.status(400);
    throw new Error('User is already active');
  }

  const restoredUser = await prisma.user.update({
    where: { id },
    data: {
      isActive: true
    },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'RESTORE',
      entity: 'User',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.info(`Admin ${req.user.email} restored user ${restoredUser.email}`);

  res.json({
    message: 'User restored successfully',
    user: restoredUser
  });
});

/**
 * @desc    Get user audit log
 * @route   GET /api/admin/users/:id/audit-log
 * @access  Private (SUPERADMIN only)
 */
export const getUserAuditLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: id },
          { entityId: id, entity: 'User' }
        ]
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        OR: [
          { userId: id },
          { entityId: id, entity: 'User' }
        ]
      }
    })
  ]);

  res.json({
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * @desc    Export user data (GDPR compliance)
 * @route   GET /api/admin/users/:id/export
 * @access  Private (SUPERADMIN only)
 */
export const exportUserData = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      businesses: {
        include: {
          knowledgeBase: true,
          conversations: {
            include: {
              messages: true
            }
          }
        }
      },
      sessions: true,
      tickets: {
        include: {
          messages: true
        }
      }
    }
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Remove sensitive data
  delete user.password;
  delete user.twoFactorSecret;
  delete user.resetToken;

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'EXPORT',
      entity: 'User',
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.info(`Admin ${req.user.email} exported data for user ${user.email}`);

  res.json({
    exportedAt: new Date(),
    userData: user
  });
});

// Default export for compatibility
export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changeUserPassword,
  toggleUserStatus,
  deleteUser,
  hardDeleteUser,
  restoreUser,
  getUserAuditLog,
  exportUserData
};
