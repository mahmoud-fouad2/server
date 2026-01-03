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

export default router;
