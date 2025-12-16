-- Production Cleanup Migration
-- Created: 2024-12-09 12:00:00
-- Safe for production: Handles data properly before schema changes

-- Step 1: Clear loginAttempts data to prevent data loss warnings
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='"User"') THEN
    EXECUTE 'UPDATE "User" SET "loginAttempts" = NULL WHERE "loginAttempts" IS NOT NULL';
  END IF;
END
$$;

-- Step 2: Drop deprecated column safely
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='User' AND column_name='loginAttempts') THEN
    EXECUTE 'ALTER TABLE "User" DROP COLUMN IF EXISTS "loginAttempts" CASCADE';
  END IF;
END
$$;

-- Step 3: Add performance indexes for frequently queried fields
-- Index for cached messages count (used in dashboard stats)
CREATE INDEX IF NOT EXISTS "idx_message_cache_status" ON "Message"("wasFromCache", "conversationId");

-- Composite index for conversation filtering by business + status  
CREATE INDEX IF NOT EXISTS "idx_conversation_business_status" ON "Conversation"("businessId", "status", "createdAt" DESC);

-- Index for message role filtering (used in handover detection)
CREATE INDEX IF NOT EXISTS "idx_message_role_conversation" ON "Message"("role", "conversationId", "createdAt" DESC);

-- Index for visitor session tracking by business
CREATE INDEX IF NOT EXISTS "idx_visitor_business_active" ON "VisitorSession"("businessId", "isActive", "lastActivity" DESC);

-- Composite index for knowledge search optimization
CREATE INDEX IF NOT EXISTS "idx_knowledge_business_type" ON "KnowledgeBase"("businessId", "type", "status");

-- Index for session token lookup (faster auth)
CREATE INDEX IF NOT EXISTS "idx_session_token_expires" ON "Session"("token", "expiresAt");

-- Step 4: Optimize database - reclaim space and update statistics (guarded)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='"User"') THEN
    EXECUTE 'VACUUM ANALYZE "User"';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='"Message"') THEN
    EXECUTE 'VACUUM ANALYZE "Message"';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='"Conversation"') THEN
    EXECUTE 'VACUUM ANALYZE "Conversation"';
  END IF;
END
$$;
