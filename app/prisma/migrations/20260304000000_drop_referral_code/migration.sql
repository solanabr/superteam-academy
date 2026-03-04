-- Drop referral-related columns from users table.
-- These columns were added directly to production DB but never tracked in the Prisma schema.
-- The NOT NULL constraint on referral_code was causing all user.upsert() calls to fail.

-- Drop referral columns if they exist (safe idempotent migration)
ALTER TABLE "users" DROP COLUMN IF EXISTS "referral_code";
ALTER TABLE "users" DROP COLUMN IF EXISTS "referred_by";
ALTER TABLE "users" DROP COLUMN IF EXISTS "referral_count";
