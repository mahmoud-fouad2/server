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

    return this.generateToken(result.user.id, result.business.id);
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ 
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        password: true,
        businesses: {
          select: { id: true }
        }
      }
    });

    if (!user) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) throw new Error('Invalid credentials');

    const businessId = user.businesses[0]?.id;
    if (!businessId) throw new Error('No business associated with this user');

    return this.generateToken(user.id, businessId);
  }

  private generateToken(userId: string, businessId: string) {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign({ id: userId, businessId }, secret, { expiresIn: '7d' });
    return { token };
  }
}
