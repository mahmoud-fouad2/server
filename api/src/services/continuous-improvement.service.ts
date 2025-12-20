import prisma from '../config/database.js';

export class ContinuousImprovementService {
  async analyzeKnowledgeGaps(businessId: string, options: { limit: number; offset: number }) {
    const gaps = await prisma.knowledgeGap.findMany({
      where: { businessId },
      orderBy: { frequency: 'desc' },
      take: options.limit,
      skip: options.offset,
    });

    const total = await prisma.knowledgeGap.count({ where: { businessId } });

    return { gaps, total };
  }

  async getSuggestions(businessId: string) {
    return prisma.improvementSuggestion.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
