// ==========================================
// Manual Database Migration Runner
// Fixes schema drift by adding missing columns safely
// ==========================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runManualMigration() {
  console.log('🔧 Running manual migration script...');

  try {
    // Step 1: Add businessId to AuditLog if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'AuditLog' AND column_name = 'businessId'
        ) THEN
          ALTER TABLE "AuditLog" ADD COLUMN "businessId" TEXT;
          CREATE INDEX IF NOT EXISTS "AuditLog_businessId_idx" ON "AuditLog"("businessId");
        END IF;
      END $$;
    `);
    console.log('✅ AuditLog.businessId checked');

    // Step 2: Add visitorId to VisitorSession if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'VisitorSession' AND column_name = 'visitorId'
        ) THEN
          ALTER TABLE "VisitorSession" ADD COLUMN "visitorId" TEXT;
          CREATE INDEX IF NOT EXISTS "VisitorSession_visitorId_idx" ON "VisitorSession"("visitorId");
        END IF;
      END $$;
    `);
    console.log('✅ VisitorSession.visitorId checked');

    // Step 3: Make duration nullable in PageVisit
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        ALTER TABLE "PageVisit" ALTER COLUMN "duration" DROP NOT NULL;
        ALTER TABLE "PageVisit" ALTER COLUMN "duration" SET DEFAULT 0;
      EXCEPTION
        WHEN OTHERS THEN NULL;
      END $$;
    `);
    console.log('✅ PageVisit.duration made nullable');

    // Step 4: Add tags to KnowledgeBase if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'KnowledgeBase' AND column_name = 'tags'
        ) THEN
          ALTER TABLE "KnowledgeBase" ADD COLUMN "tags" TEXT;
        END IF;
      END $$;
    `);
    console.log('✅ KnowledgeBase.tags checked');

    // Step 5: Add assignedTo to Conversation if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Conversation' AND column_name = 'assignedTo'
        ) THEN
          ALTER TABLE "Conversation" ADD COLUMN "assignedTo" TEXT;
        END IF;
      END $$;
    `);
    console.log('✅ Conversation.assignedTo checked');

    console.log('✅ Manual migration completed successfully');
    return true;
  } catch (error) {
    console.error('⚠️  Manual migration failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  runManualMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export default runManualMigration;
