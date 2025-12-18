import prisma from '../config/database.js';
import * as _bcrypt from 'bcryptjs';
const bcrypt = _bcrypt.default || _bcrypt;

class AdminUserService {
  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers({ page = 1, limit = 10, search = '', role = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(role && { role }),
      ...(status === 'active' && { isActive: true }),
      ...(status === 'inactive' && { isActive: false })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          lastLoginIp: true,
          businesses: {
            select: {
              id: true,
              name: true,
              status: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        businesses: {
          include: {
            knowledgeBase: { take: 5 },
            conversations: { take: 5, orderBy: { createdAt: 'desc' } }
          }
        },
        sessions: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        tickets: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            businesses: true,
            sessions: true,
            tickets: true
          }
        }
      }
    });
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    const { email, password, name, role, isActive } = userData;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        isActive
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
  }

  /**
   * Update user
   */
  async updateUser(id, updateData) {
    return prisma.user.update({
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
  }

  /**
   * Soft delete user
   */
  async softDeleteUser(id) {
    return prisma.user.update({
      where: { id },
      data: {
        // Note: Prisma schema does not include a `deletedAt` field. Use `isActive=false` for soft-deletes.
        isActive: false
      }
    });
  }
}

export default new AdminUserService();