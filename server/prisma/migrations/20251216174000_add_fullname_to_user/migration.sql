-- Add fullName column to User table (optional, nullable)
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "fullName" TEXT;
