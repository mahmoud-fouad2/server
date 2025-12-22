import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginInput, RegisterInput } from '../shared_local/index.js';

export class AuthService {
  
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Transaction to create User and Business together
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          role: 'ADMIN' // First user is admin of their business
        }
      });

      const business = await tx.business.create({
        data: {
          name: data.businessName,
          userId: user.id,
          activityType: 'OTHER', // Default
          planType: 'TRIAL'
        }
      });

      return { user, business };
    });

    return this.generateToken(result.user.id, result.business.id, {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      businessId: result.business.id,
      businesses: [{ 
        id: result.business.id, 
        name: result.business.name,
        planType: 'TRIAL',
        status: 'TRIAL'
      }]
    });
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ 
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        businesses: {
          select: { 
            id: true,
            name: true,
            planType: true,
            status: true
          }
        }
      }
    });

    if (!user) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) throw new Error('Invalid credentials');

    const businessId = user.businesses[0]?.id;
    if (!businessId) throw new Error('No business associated with this user');

    return this.generateToken(user.id, businessId, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId,
      businesses: user.businesses
    });
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        businesses: {
          select: {
            id: true,
            name: true,
            planType: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      businessId: user.businesses[0]?.id,
      businesses: user.businesses
    };
  }

  async updateProfile(userId: string, data: { name?: string; email?: string; password?: string }) {
    const updates: Record<string, any> = {};

    if (typeof data.name === 'string' && data.name.trim()) {
      updates.name = data.name.trim();
    }

    if (typeof data.email === 'string' && data.email.trim()) {
      const normalizedEmail = data.email.trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already in use');
      }
      updates.email = normalizedEmail;
    }

    if (typeof data.password === 'string' && data.password.trim()) {
      const password = data.password.trim();
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updates).length) {
      await prisma.user.update({ where: { id: userId }, data: updates });
    }

    return this.getProfile(userId);
  }

  private generateToken(userId: string, businessId: string, userData?: any) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('CRITICAL: JWT_SECRET environment variable is not set. Cannot generate authentication tokens.');
    }
    const token = jwt.sign({ id: userId, businessId }, secret, { expiresIn: '7d' });
    return { token, user: userData };
  }
}
