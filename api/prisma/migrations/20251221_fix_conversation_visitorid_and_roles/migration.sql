-- Add missing enum values for Role (production DB compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'Role' AND e.enumlabel = 'SUPERADMIN'
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'Role' AND e.enumlabel = 'EMPLOYEE'
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'EMPLOYEE';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add missing Conversation fields
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "visitorId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "metadata" TEXT;

-- Ensure Channel enum exists (if DB already has it, this is a no-op)
DO $$
BEGIN
  PERFORM 1 FROM pg_type WHERE typname = 'Channel';
  IF NOT FOUND THEN
    CREATE TYPE "Channel" AS ENUM ('WIDGET', 'WHATSAPP', 'TELEGRAM');
  END IF;
END $$;

-- Add channel column as enum when missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Conversation' AND column_name = 'channel'
  ) THEN
    ALTER TABLE "Conversation" ADD COLUMN "channel" "Channel";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Conversation' AND column_name = 'channel'
  ) THEN
    ALTER TABLE "Conversation" ALTER COLUMN "channel" SET DEFAULT 'WIDGET';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Conversation_visitorId_idx" ON "Conversation"("visitorId");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Visitor'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Conversation' AND column_name = 'visitorId'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Conversation_visitorId_fkey'
  ) THEN
    ALTER TABLE "Conversation"
      ADD CONSTRAINT "Conversation_visitorId_fkey"
      FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

-- Add missing Message fields
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "metadata" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "role" TEXT;
