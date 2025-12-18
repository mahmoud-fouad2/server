#!/usr/bin/env node
/**
 * Convert demo business to real business and seed a default widgetConfig
 * Usage: set DATABASE_URL in env then run: node scripts/convert-demo-business.js <businessId>
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const businessId = process.argv[2];
  if (!businessId) {
    console.error('Usage: node scripts/convert-demo-business.js <businessId>');
    process.exit(1);
  }

  console.log('Converting demo business:', businessId);

  const existing = await prisma.business.findUnique({ where: { id: businessId } });
  if (!existing) {
    console.error('Business not found:', businessId);
    process.exit(2);
  }

  // Build a sensible widgetConfig if missing
  const defaultConfig = existing.widgetConfig ? JSON.parse(existing.widgetConfig) : {};
  const updatedConfig = {
    welcomeMessage: defaultConfig.welcomeMessage || 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
    primaryColor: defaultConfig.primaryColor || '#0070f3',
    personality: defaultConfig.personality || 'friendly',
    showBranding: typeof defaultConfig.showBranding === 'boolean' ? defaultConfig.showBranding : true,
    avatar: defaultConfig.avatar || 'robot'
  };

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      isDemo: false,
      widgetConfig: JSON.stringify(updatedConfig),
      updatedAt: new Date()
    }
  });

  console.log('Converted business:', updated.id, 'isDemo:', updated.isDemo);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});