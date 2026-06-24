-- ============================================
-- Lock down enrollments writes to service_role + add integrity constraints
-- ============================================
-- The authenticated INSERT/DELETE policies let any user write/remove their own
-- enrollment rows directly via the Supabase client. A user could delete and
-- re-insert their enrollment to forge a fresh enrolled_at, faking a sub-24h
-- enrolled->completed window. The Speed Runner achievement check reads
-- enrolled_at vs completed_at, so a forged window mints a real on-chain
-- achievement (this blocks #99) and pollutes enrollment data.
--
-- All legitimate writes already go through service_role, which bypasses RLS:
--   * the Helius enroll/unenroll/finalize webhook (lib/helius/event-handlers.ts)
--   * its retry queue (lib/solana/onchain-queue.ts)
--   * the admin resync route (app/api/admin/resync/route.ts)
-- The client only submits the on-chain tx and lets the webhook sync the row, so
-- dropping these policies does not affect enroll/unenroll. SELECT policies
-- ("Users can view their own enrollments" / "Public profile enrollments are
-- viewable") are intentionally left in place. Mirrors the user_progress
-- lockdown in 20260624164418_restrict_user_progress_writes.sql.

DROP POLICY IF EXISTS "Users can enroll themselves" ON enrollments;
DROP POLICY IF EXISTS "Users can delete their own enrollments" ON enrollments;

-- Integrity constraints. PG15 has no ADD CONSTRAINT IF NOT EXISTS for CHECKs,
-- so guard each add for idempotency.

-- A course can only be completed at or after it was enrolled. Closes the forged
-- sub-24h enrolled->completed window. NULL completed_at (not yet finished)
-- passes, so this rejects no existing valid row. No FK on course_id: courses
-- live in Sanity, not Postgres.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_enrollments_completed_after_enrolled'
      AND conrelid = 'public.enrollments'::regclass
  ) THEN
    ALTER TABLE enrollments
      ADD CONSTRAINT chk_enrollments_completed_after_enrolled
      CHECK (completed_at IS NULL OR completed_at >= enrolled_at);
  END IF;
END $$;

-- A completion timestamp may only exist on a completed row. Legit writers
-- (Helius webhook + admin resync) always set completed = true alongside
-- completed_at, so this rejects no valid row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_user_progress_completed_at_requires_completed'
      AND conrelid = 'public.user_progress'::regclass
  ) THEN
    ALTER TABLE user_progress
      ADD CONSTRAINT chk_user_progress_completed_at_requires_completed
      CHECK (completed_at IS NULL OR completed = true);
  END IF;
END $$;
