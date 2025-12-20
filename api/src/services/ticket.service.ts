import { PrismaClient, Ticket, TicketMessage, TicketStatus, TicketPriority } from '@prisma/client';
import prisma from '../config/database.js';

export class TicketService {
  async createTicket(
    userId: string,
    businessId: string,
    data: { subject: string; message: string; priority?: TicketPriority }
  ) {
    return prisma.ticket.create({
      data: {
        subject: data.subject,
        priority: data.priority || 'MEDIUM',
        businessId,
        creatorId: userId,
        messages: {
          create: {
            message: data.message,
            userId: userId,
            // isAdmin: false, // Removed as it's not in schema
          },
        },
      },
      include: {
        messages: true,
      },
    });
  }

  async getTickets(businessId: string) {
    return prisma.ticket.findMany({
      where: { businessId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTicketById(ticketId: string, businessId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          include: {
            user: {
              select: { name: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket || ticket.businessId !== businessId) {
      throw new Error('Ticket not found or access denied');
    }

    return ticket;
  }

  async addMessage(
    ticketId: string,
    userId: string,
    message: string,
    isAdmin: boolean = false
  ) {
    return prisma.ticketMessage.create({
      data: {
        ticketId,
        userId,
        message,
      },
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
    });
  }

  async updateStatus(ticketId: string, status: TicketStatus) {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
    });
  }
}
