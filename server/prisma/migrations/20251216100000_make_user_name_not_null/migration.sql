-- Make User.name NOT NULL safely
-- Step 1: Fill existing NULL names with a reasonable default
UPDATE "User"
SET "name" = COALESCE(NULLIF(TRIM("fullName"), ''), SUBSTRING(email FROM '^[^@]+'), id)
WHERE "name" IS NULL;

-- Step 2: Ensure no NULLs remain
-- (Optional safety check: fail here if there are still NULLs)
-- Step 3: Make the column NOT NULL
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;
