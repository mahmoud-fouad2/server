import { PrismaClient, User, Role } from '@prisma/client';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';

export class TeamService {
  async getEmployees(businessId: string) {
    return prisma.user.findMany({
      where: {
        employerId: businessId,
        role: 'EMPLOYEE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        role: true,
      },
    });
  }

  async addEmployee(businessId: string, data: { name: string; email: string; password: string; role?: Role }) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        employerId: businessId,
        role: data.role || 'CLIENT', // Should probably be AGENT or similar if Role enum supports it
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async removeEmployee(employeeId: string, businessId: string) {
    // Verify employee belongs to business
    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        employerId: businessId,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return prisma.user.delete({
      where: { id: employeeId },
    });
  }
}
