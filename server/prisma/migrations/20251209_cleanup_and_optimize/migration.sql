-- Migration: Remove deprecated loginAttempts and add performance indexes
-- Created: 2024-12-09
-- Description: Clean up deprecated fields and optimize database queries

-- Step 1: Drop deprecated column (with CASCADE to handle any constraints)
-- Note: This column is deprecated and no longer used in the application
ALTER TABLE "User" DROP COLUMN IF EXISTS "loginAttempts" CASCADE;

-- Step 2: Add performance indexes for frequently queried fields

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

-- VACUUM ANALYZE to reclaim space and update statistics
VACUUM ANALYZE "User";
VACUUM ANALYZE "Message";
VACUUM ANALYZE "Conversation";
