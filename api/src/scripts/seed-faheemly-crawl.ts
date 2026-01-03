import dotenv from 'dotenv';
import prisma from '../config/database.js';
import { KnowledgeService } from '../services/knowledge.service.js';

dotenv.config();

const knowledgeService = new KnowledgeService();

async function main() {
  const businessId =
    process.env.SEED_BUSINESS_ID ||
    process.env.NEXT_PUBLIC_WIDGET_BUSINESS_ID ||
    'cmjx5hz7a000br594zctuurus';
  const url = process.env.SEED_URL || 'https://faheemly.com';
  const maxDepth = Number(process.env.SEED_MAX_DEPTH || 3);
  const maxPages = Number(process.env.SEED_MAX_PAGES || 150);

  if (!businessId) {
    throw new Error('Missing businessId (set SEED_BUSINESS_ID)');
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    throw new Error(
      `Business not found: ${businessId}. Run the normal seed first (npm run db:seed or your production seed).`
    );
  }

  const result = await knowledgeService.importFromUrl(businessId, url, {
    maxDepth: Number.isFinite(maxDepth) ? maxDepth : 3,
    maxPages: Number.isFinite(maxPages) ? maxPages : 150,
  });

  console.log('✅ Crawl job queued');
  console.log({ businessId, url, maxDepth, maxPages, ...result });
  console.log('ℹ️ Ensure the Render worker service is running and REDIS_URL is configured.');
}

main()
  .catch((error) => {
    console.error('❌ Seed crawl failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
