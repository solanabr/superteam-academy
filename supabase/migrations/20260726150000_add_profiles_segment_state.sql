-- ============================================================================
-- Migration: profiles segment state — /start intake (LX-A3, #566)
--
-- Adds the post-auth home for the /start intake answers so a learner's segment,
-- goal, and daily lesson goal survive across devices once they sign in (pre-auth
-- they live in localStorage; SegmentSync copies them here on first sign-in):
--
--   segment     SMALLINT  1|2|3   routing segment (LearnerSegment) — CORE web2 /
--                                 web3 dev / beginner. Topic-routing only at
--                                 launch (§3.5 deferral).
--   goal        TEXT              learner goal (job|build|explore) — consumed as
--                                 path-page framing copy, nothing reward-bearing.
--   daily_goal  SMALLINT  1..20   chosen daily lesson goal. The picker's OPTIONS
--                                 derive from the daily lesson quest targets, so
--                                 the value always matches a real quest target —
--                                 but nothing reads this column yet; it is stored
--                                 for a future quest-engine wiring (E2 intention).
--
-- All three are NULLABLE (a learner who never ran the intake has none) and all
-- three DEFAULT NULL, so existing rows are untouched and the ADD COLUMNs take no
-- backfill.
--
-- RLS — SELF-WRITABLE via the existing own-row UPDATE policy:
--   * The existing "Users can update their own profile" policy
--     (FOR UPDATE USING auth.uid() = id) already governs every profiles column,
--     so these three become self-writable with NO new policy. That is the whole
--     mechanism — a learner PATCHing their own row updates them under RLS.
--   * WHY WHOLE-ROW, NOT A THREE-COLUMN-SCOPED POLICY: Postgres RLS policies gate
--     ROWS, never columns (USING/WITH CHECK are row predicates; there is no
--     column list in a policy). segment/goal/daily_goal are non-sensitive and
--     nothing reward-bearing reads them, so they ride the existing own-row policy
--     exactly like bio / username / is_public. A redundant per-column policy is
--     both impossible (RLS can't do it) and unnecessary.
--   * SAFETY (#699 CORRECTION): an earlier version of this header cited the
--     enforce_profile_role_write trigger as the reason whole-row self-write is
--     safe. That trigger does NOT exist on prod — profiles.role was retired by
--     SP1 (migration 20260710120000) before this migration was applied. The
--     honest guarantee: NOTHING on profiles is privilege-bearing, so whole-row
--     self-write is bounded by the CHECK constraints alone. The surviving
--     column-write lock is enforce_profile_wallet_write (wallet_address), which
--     this migration also does not touch. (Pinned by segment-state-rls-guard.test.ts.)
--
-- Idempotent (repo convention, cf. 20260726120000 / 20260703130652):
-- ADD COLUMN IF NOT EXISTS + pg_constraint-guarded CHECK adds (Postgres has no
-- ADD CONSTRAINT IF NOT EXISTS for CHECKs). Re-applying is a no-op.
--
-- No content-schema change (LX-A3 accept): the routing table is an app-side
-- constant (SEGMENT_ENTRY_COURSE), never path metadata.
-- ============================================================================

-- Explicit transaction: under the Supabase CLI this nests inside the per-file
-- wrap; under a manual psql apply it makes the column + constraint adds atomic.
BEGIN;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS segment SMALLINT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal SMALLINT;

-- CHECK-in-list bounds (same shape as the other profiles CHECKs). Guarded add: no
-- ADD CONSTRAINT IF NOT EXISTS for CHECKs. NULL passes every CHECK, so the
-- never-onboarded rows are unaffected.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_profiles_segment'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT chk_profiles_segment CHECK (segment IN (1, 2, 3));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_profiles_goal'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT chk_profiles_goal CHECK (goal IN ('job', 'build', 'explore'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_profiles_daily_goal'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    -- Bounded on BOTH ends: a daily lesson goal above ~20 is not a real target,
    -- and an unbounded self-writable integer is a needless abuse surface.
    ALTER TABLE profiles
      ADD CONSTRAINT chk_profiles_daily_goal CHECK (daily_goal BETWEEN 1 AND 20);
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK (tested) — restores the exact pre-migration state. The columns and
-- their CHECKs are all new (nothing referenced them before), so the rollback is
-- an unconditional drop; DROP COLUMN removes its CHECK with it. Run as one
-- transaction:
-- ----------------------------------------------------------------------------
-- BEGIN;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS daily_goal;  -- drops chk_profiles_daily_goal
-- ALTER TABLE profiles DROP COLUMN IF EXISTS goal;        -- drops chk_profiles_goal
-- ALTER TABLE profiles DROP COLUMN IF EXISTS segment;     -- drops chk_profiles_segment
-- COMMIT;
-- ============================================================================
