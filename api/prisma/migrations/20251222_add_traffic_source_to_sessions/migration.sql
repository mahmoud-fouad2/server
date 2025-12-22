-- Track the origin of each visitor session for analytics
ALTER TABLE "VisitorSession" ADD COLUMN IF NOT EXISTS "trafficSource" TEXT;
