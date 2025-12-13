-- Migration: add unique constraint to Subscription.paymentId
-- This migration adds a UNIQUE constraint to the `paymentId` field of `Subscription`.
-- Note: Apply with `npx prisma migrate deploy` or `npx prisma db push` in your environment.

ALTER TABLE "Subscription"
ADD CONSTRAINT "Subscription_paymentId_unique" UNIQUE ("paymentId");
