import prisma from '../config/database.js';

export class CustomAIModelService {
  async createModel(businessId: string, data: { name: string; description?: string; config?: any }) {
    return prisma.customAIModel.create({
      data: {
        businessId,
        name: data.name,
        description: data.description,
        config: data.config ? JSON.stringify(data.config) : undefined,
      },
    });
  }

  async getModels(businessId: string) {
    return prisma.customAIModel.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteModel(id: string, businessId: string) {
    const model = await prisma.customAIModel.findFirst({ where: { id, businessId } });
    if (!model) throw new Error('Model not found');
    
    return prisma.customAIModel.delete({ where: { id } });
  }
}
