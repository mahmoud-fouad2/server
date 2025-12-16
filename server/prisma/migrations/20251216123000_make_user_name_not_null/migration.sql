-- Safe migration: fill NULL "name" values then make the column NOT NULL
-- 1) Fill missing names using fullName, email prefix, or id as fallback
BEGIN;

UPDATE "User"
SET "name" = COALESCE(
  NULLIF(TRIM("fullName"), ''),
  SUBSTRING("email" FROM '^[^@]+'),
  id::text
)
WHERE "name" IS NULL;

-- 2) Ensure no empty-string values remain
UPDATE "User"
SET "name" = COALESCE(NULLIF(TRIM("name"), ''), SUBSTRING("email" FROM '^[^@]+'), id::text)
WHERE "name" IS NULL OR TRIM("name") = '';

-- 3) Make column required
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

COMMIT;
