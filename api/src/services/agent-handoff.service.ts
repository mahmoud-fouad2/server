import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

interface HandoffRequest {
  conversationId: string;
  businessId: string;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

class AgentHandoffService {
  async requestHandoff(data: HandoffRequest): Promise<any> {
    try {
      // Create handoff request
      const handoff = await prisma.agentHandoff.create({
        data: {
          conversationId: data.conversationId,
          businessId: data.businessId,
          reason: data.reason,
          priority: data.priority,
          requestedBy: 'SYSTEM',
          status: 'PENDING',
        },
      });

      // Update conversation status
      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { status: 'HANDOVER_REQUESTED' },
      });

      logger.info(`Handoff requested for conversation: ${data.conversationId}`);

      return handoff;
    } catch (error: any) {
      logger.error('Failed to request handoff:', error.message);
      throw error;
    }
  }

  async acceptHandoff(handoffId: string, agentId: string): Promise<boolean> {
    try {
      const handoff = await prisma.agentHandoff.update({
        where: { id: handoffId },
        data: {
          agentId,
          status: 'ACCEPTED',
        },
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: handoff.conversationId },
        data: {
          status: 'AGENT_ACTIVE',
          agentId,
        },
      });

      logger.info(`Handoff ${handoffId} accepted by agent ${agentId}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to accept handoff:', error.message);
      return false;
    }
  }

  async completeHandoff(
    handoffId: string,
    qualityScore?: number,
    feedback?: string
  ): Promise<boolean> {
    try {
      await prisma.agentHandoff.update({
        where: { id: handoffId },
        data: {
          status: 'COMPLETED',
          qualityScore,
          feedback,
          resolvedAt: new Date(),
        },
      });

      // Get handoff to update conversation
      const handoff = await prisma.agentHandoff.findUnique({
        where: { id: handoffId },
      });

      if (handoff) {
        await prisma.conversation.update({
          where: { id: handoff.conversationId },
          data: {
            status: 'CLOSED',
            agentRating: qualityScore,
            agentFeedback: feedback,
          },
        });
      }

      logger.info(`Handoff ${handoffId} completed`);
      return true;
    } catch (error: any) {
      logger.error('Failed to complete handoff:', error.message);
      return false;
    }
  }

  async getPendingHandoffs(businessId: string): Promise<any[]> {
    try {
      const handoffs = await prisma.agentHandoff.findMany({
        where: {
          businessId,
          status: 'PENDING',
        },
        include: {
          conversation: {
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 5,
              },
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
      });

      return handoffs;
    } catch (error: any) {
      logger.error('Failed to get pending handoffs:', error.message);
      return [];
    }
  }

  async getAgentHandoffs(agentId: string, status?: string): Promise<any[]> {
    try {
      const where: any = { agentId };
      if (status) {
        where.status = status;
      }

      const handoffs = await prisma.agentHandoff.findMany({
        where,
        include: {
          conversation: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return handoffs;
    } catch (error: any) {
      logger.error('Failed to get agent handoffs:', error.message);
      return [];
    }
  }

  async getHandoffAnalytics(businessId: string, days: number = 30): Promise<any> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const handoffs = await prisma.agentHandoff.findMany({
        where: {
          businessId,
          createdAt: { gte: since },
        },
      });

      const completed = handoffs.filter((h) => h.status === 'COMPLETED');
      const avgQualityScore = completed.reduce((sum, h) => sum + (h.qualityScore || 0), 0) / completed.length;

      const avgResolutionTime = completed.reduce((sum, h) => {
        const duration = h.resolvedAt && h.createdAt
          ? h.resolvedAt.getTime() - h.createdAt.getTime()
          : 0;
        return sum + duration;
      }, 0) / completed.length;

      return {
        total: handoffs.length,
        pending: handoffs.filter((h) => h.status === 'PENDING').length,
        accepted: handoffs.filter((h) => h.status === 'ACCEPTED').length,
        completed: completed.length,
        avgQualityScore: avgQualityScore || 0,
        avgResolutionTimeMinutes: Math.round(avgResolutionTime / 60000),
      };
    } catch (error: any) {
      logger.error('Failed to get handoff analytics:', error.message);
      return null;
    }
  }
}

export default new AgentHandoffService();
