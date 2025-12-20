import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const listApiKeys = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user?.businessId;
    if (!businessId) return res.status(400).json({ error: 'Business ID required' });

    const keys = await prisma.apiKey.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });

    // Mask the key for display, but maybe return full key on creation only?
    // For list, we usually mask.
    const maskedKeys = keys.map(k => ({
      ...k,
      key: `${k.key.substring(0, 12)}...`,
    }));

    res.json(maskedKeys);
  } catch (error) {
    console.error('List API Keys Error:', error);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
};

export const createApiKey = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user?.businessId;
    if (!businessId) return res.status(400).json({ error: 'Business ID required' });
    const { name } = req.body;

    const key = `sk_live_${crypto.randomBytes(24).toString('hex')}`;

    const newKey = await prisma.apiKey.create({
      data: {
        name: name || 'Default Key',
        key,
        businessId,
      },
    });

    res.json(newKey);
  } catch (error) {
    console.error('Create API Key Error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
};

export const deleteApiKey = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user?.businessId;
    const { id } = req.params;

    await prisma.apiKey.deleteMany({
      where: { id, businessId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete API Key Error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
};
