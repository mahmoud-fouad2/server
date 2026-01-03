import { Router, Request, Response } from 'express';
import { systemController } from '../controllers/system.controller.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { authenticateSystemKey } from '../middleware/systemKey.js';
import { Role, PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

router.post(
  '/flush-cache',
  authenticateToken,
  authorizeRole([Role.ADMIN, Role.SUPERADMIN]),
  systemController.flushCache
);

router
  .route('/flush-cache/service')
  .all(authenticateSystemKey)
  .post(systemController.flushCache)
  .get(systemController.flushCache);

// Secret endpoint to seed Faheemly Business (Protected by secret key)
router.post('/seed-faheemly', async (req: Request, res: Response) => {
  try {
    const { secretKey } = req.body;
    
    // Verify secret key
    const expectedKey = process.env.SEED_SECRET_KEY || 'faheemly-seed-2026';
    if (secretKey !== expectedKey) {
      logger.warn('Unauthorized seed attempt', { ip: req.ip });
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    logger.info('🌱 Starting Faheemly Business seed via API...');
    
    const BUSINESS_ID = 'cmjx5hz7a000br594zctuurus';

    // Update Business Settings
    await prisma.business.update({
      where: { id: BUSINESS_ID },
      data: {
        botTone: 'professional',
        systemPrompt: `أنت مساعد ذكي لمنصة فهملي (Faheemly)، أقوى منصة شات بوت عربية مدعومة بالذكاء الاصطناعي.

**دورك:**
- مساعدة العملاء في فهم خدمات فهملي
- الرد على الاستفسارات بشكل احترافي ودقيق
- توضيح الأسعار والباقات والمميزات

**قواعد:**
1. رد باللهجة المناسبة للعميل
2. استخدم أسلوب احترافي وودود
3. لا تخرج عن سياق فهملي
4. الأسعار: تبدأ من 149 ريال شهرياً`,
        language: 'ar'
      }
    });

    // Check existing KB
    const existingKB = await prisma.knowledgeBase.count({
      where: { businessId: BUSINESS_ID }
    });

    if (existingKB > 0) {
      return res.json({
        success: true,
        message: 'Business updated. KB already has entries.',
        existingEntries: existingKB
      });
    }

    // Add KB entries (shortened for space)
    const entries = [
      {
        title: 'عن فهملي',
        content: 'فهملي منصة شات بوت عربية ذكية. نخدم السعودية ومصر والإمارات. نوفر ربط واتساب وويدجت للمواقع وتمييز اللهجات.',
        tags: 'من نحن,about'
      },
      {
        title: 'الأسعار',
        content: 'باقة البداية: 149 ريال. باقة الأعمال: 399 ريال. باقة المؤسسات: 999+ ريال. تجربة مجانية 7 أيام.',
        tags: 'أسعار,pricing'
      }
    ];

    for (const e of entries) {
      await prisma.knowledgeBase.create({
        data: {
          businessId: BUSINESS_ID,
          title: e.title,
          content: e.content,
          tags: e.tags,
          source: 'manual'
        }
      });
    }

    res.json({ success: true, message: 'Seeded!', added: entries.length });

  } catch (error: any) {
    logger.error('Seed failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate embeddings for KB
router.post('/generate-embeddings', async (req: Request, res: Response) => {
  try {
    const { secretKey } = req.body;
    
    if (secretKey !== (process.env.SEED_SECRET_KEY || 'faheemly-seed-2026')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    logger.info('🔄 Starting embedding generation...');
    
    const BUSINESS_ID = 'cmjx5hz7a000br594zctuurus';
    
    // Import embedding service
    const { default: embeddingService } = await import('../services/embedding.service.js');

    // Get KB entries
    const kbEntries = await prisma.knowledgeBase.findMany({
      where: { businessId: BUSINESS_ID },
      select: { id: true, title: true, content: true }
    });

    if (kbEntries.length === 0) {
      return res.json({ success: false, message: 'No KB entries found' });
    }

    // Clear existing chunks
    await prisma.knowledgeChunk.deleteMany({ where: { businessId: BUSINESS_ID } });

    let processed = 0;
    let failed = 0;

    // Process each entry
    for (const kb of kbEntries) {
      try {
        const text = `${kb.title}\n${kb.content}`;
        const chunks = splitText(text, 800);
        
        for (let i = 0; i < chunks.length; i++) {
          try {
            const { embedding, provider } = await embeddingService.generateEmbedding(chunks[i]);
            
            await prisma.knowledgeChunk.create({
              data: {
                businessId: BUSINESS_ID,
                knowledgeBaseId: kb.id,
                content: chunks[i],
                embedding: JSON.stringify(embedding),
                metadata: JSON.stringify({ provider, title: kb.title, chunk: i })
              }
            });
            
            processed++;
            await new Promise(r => setTimeout(r, 100)); // Rate limit
          } catch (e: any) {
            failed++;
            logger.error(`Chunk failed: ${e.message}`);
          }
        }
      } catch (e: any) {
        failed++;
      }
    }

    res.json({
      success: true,
      message: 'Embeddings generated',
      processed,
      failed,
      total: processed + failed
    });

  } catch (error: any) {
    logger.error('Embedding generation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function splitText(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?؟]\s+/);
  let current = '';

  for (const s of sentences) {
    if ((current + s).length <= maxLen) {
      current += s + '. ';
    } else {
      if (current) chunks.push(current.trim());
      current = s + '. ';
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text.substring(0, maxLen)];
}

export default router;
