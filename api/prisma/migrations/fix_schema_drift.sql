-- ==========================================
-- Database Migration Script
-- Fix schema drift and add missing columns
-- ==========================================

-- Step 1: Add businessId to AuditLog if not exists (safe)
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

-- Step 2: Add visitorId to VisitorSession if not exists (safe, nullable)
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

-- Step 3: Make duration nullable in PageVisit if needed
DO $$ 
BEGIN
  ALTER TABLE "PageVisit" ALTER COLUMN "duration" DROP NOT NULL;
  ALTER TABLE "PageVisit" ALTER COLUMN "duration" SET DEFAULT 0;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Column already nullable or doesn't exist
END $$;

-- Step 4: Clean up orphaned sessions (sessions without valid visitor)
-- Only if Visitor table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'Visitor'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'VisitorSession' AND column_name = 'visitorId'
  ) THEN
    -- Delete sessions that have invalid visitorId
    DELETE FROM "VisitorSession" 
    WHERE "visitorId" IS NOT NULL 
    AND "visitorId" NOT IN (SELECT id FROM "Visitor");
  END IF;
END $$;

-- Step 5: Add tags to KnowledgeBase if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'KnowledgeBase' AND column_name = 'tags'
  ) THEN
    ALTER TABLE "KnowledgeBase" ADD COLUMN "tags" TEXT;
  END IF;
END $$;

-- Step 6: Ensure assignedTo column exists in Conversation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Conversation' AND column_name = 'assignedTo'
  ) THEN
    ALTER TABLE "Conversation" ADD COLUMN "assignedTo" TEXT;
  END IF;
END $$;

-- Done!
SELECT 'Migration completed successfully!' as status;
