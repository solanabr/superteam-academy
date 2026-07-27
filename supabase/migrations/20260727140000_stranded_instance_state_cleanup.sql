-- ============================================================================
-- Migration: reset the chain-mirrored learner state stranded by the program
-- move (Dsro2Cd9 is live; the DB still mirrors the superseded 7NeJa instance).
-- Task: #607 (P0)  [area:onchain][area:db]  — reset-wave pattern (cf. #356)
-- ----------------------------------------------------------------------------
-- ⚠️  certificates IS EXCLUDED. It is NOT reset here (owner decision:
--     "investigate separately"). Its 4 rows are Metaplex Core assets that may
--     still exist in a wallet, so the DB row can be the only surviving record
--     of a real credential. This migration never writes certificates and
--     asserts its row count is unchanged. profiles and auth.users are likewise
--     NEVER TOUCHED — asserted unchanged at COMMIT.
--
-- WHAT HAPPENED. The app now writes to program Dsro2Cd9…; the prior instance
-- 7NeJa… holds the only on-chain counterparts of the learner state below.
-- Enrollment PDAs are program-derived, so that state is unreachable from the
-- new id and cannot be migrated. The 5 stranded-era courses were also
-- deactivated in the on-chain window (#713/#606), so these rows are
-- doubly-orphaned. Owner decision (2026-07-25): do NOT re-mint XP — start from
-- zero and clean up the DB. Nothing has been awarded since the move (the Helius
-- webhook still points at the old program — see #607), so this touches pre-move
-- history only; no live learner activity is discarded.
--
-- WHAT THIS DOES. Reset ONLY chain-mirrored state:
--   • enrollments, user_progress, xp_transactions, user_achievements — straight
--     DELETE (every row is stranded-era; the counts below are all 2 users).
--   • user_xp — UPDATE-to-zero, NEVER DELETE (see the 🔴 note).
--
-- 🔴 user_xp IS 1:1 WITH profiles — UPDATE, NEVER DELETE. Unlike the other four
-- tables (rows for 2 users), user_xp has a row for ALL 75 learners: a row is
-- created at signup regardless of activity. 73 of those are pristine zeros
-- belonging to last week's event cohort. A `DELETE FROM user_xp` — the shape
-- that is correct for the other four — would remove 73 rows with nothing to
-- reset, a blast radius 37× the real target, adjacent to the exact constraint
-- this issue protects. So user_xp gets a WHERE-scoped UPDATE that touches
-- EXACTLY the 2 rows carrying state and cannot reach the 73 pristine ones. The
-- post-apply assert pins user_xp's row count unchanged (== profiles), enforcing
-- "never deleted from" structurally.
--
-- DRY-RUN COUNTS (gate, prod pywhtmidcrptomrabbrw, posted on #607 2026-07-27).
-- RE-VERIFY these against the live DB BEFORE applying — the assert block below
-- hard-pins profiles=75 / user_xp=75 / certificates=4, so a drift (e.g. new
-- signups grew the cohort) fails the migration and forces reconciliation rather
-- than running against stale evidence. Re-run:
--
--   select 'enrollments' t, count(*) rows, count(distinct user_id) users from enrollments
--   union all select 'user_progress', count(*), count(distinct user_id) from user_progress
--   union all select 'user_xp', count(*), count(distinct user_id) from user_xp
--   union all select 'xp_transactions', count(*), count(distinct user_id) from xp_transactions
--   union all select 'user_achievements', count(*), count(distinct user_id) from user_achievements;
--   -- expected: enrollments 7/2 · user_progress 63/2 · xp_transactions 16/2
--   --           user_achievements 7/2 · user_xp 75/75
--
--   select count(*) filter (where total_xp > 0 OR current_streak > 0
--       OR longest_streak > 0 OR last_activity_date IS NOT NULL) as active_rows
--   from user_xp;   -- expected: 2 (the only rows the UPDATE may touch)
--
--   select 'profiles' t, count(*) from profiles           -- expected 75 (NEVER TOUCH)
--   union all select 'auth.users', count(*) from auth.users;
--   select count(*) from certificates;                    -- expected 4 (EXCLUDED)
--
-- Idempotent: the DELETEs re-run to 0 rows; the UPDATE's WHERE matches 0 rows
-- once state is zeroed. Safe to re-apply (re-apply is a no-op). One explicit
-- BEGIN/COMMIT so the whole file is a single transaction under a manual apply
-- and every assert can roll the batch back atomically.
--
-- schema.sql is NOT touched: this is a DATA-only migration (DML, no DDL). The
-- schema.sql snapshot carries structure, not rows, so there is nothing to
-- mirror (cf. the data-only precedents 20260630165536 / 20260703150000). The
-- guard test pins the UPDATE-not-DELETE and never-touch invariants against this
-- file directly.
--
-- ⚠️  NOT ROLLBACK-ABLE — this is destructive and the ROLLBACK section at the
-- bottom says so honestly (the #750 lesson: a rollback that cannot restore the
-- data must not pretend to). Deleted rows and overwritten XP are gone. Per the
-- owner decision, recovery is by design "progress is recoverable": learners
-- redo the affected activity against the live program, and XP re-accrues once
-- the reward loop is repointed (the #607 webhook fix). Certificates are
-- untouched, so no credential is lost.
-- ============================================================================

BEGIN;

-- Snapshot the must-not-touch / excluded baselines inside the transaction so the
-- post-apply asserts can prove they did not move (ON COMMIT DROP: temp, no
-- residue). Captured BEFORE any DML.
CREATE TEMP TABLE _cleanup_baseline ON COMMIT DROP AS
SELECT
  (SELECT count(*) FROM public.profiles)     AS profiles,
  (SELECT count(*) FROM auth.users)          AS auth_users,
  (SELECT count(*) FROM public.user_xp)      AS user_xp,
  (SELECT count(*) FROM public.certificates) AS certificates;

-- ── Reset chain-mirrored state (straight DELETEs; every row is stranded-era) ──
-- Maps to the dry-run counts: enrollments 7 · user_progress 63 ·
-- xp_transactions 16 · user_achievements 7 (all 2 users). Idempotent: a re-run
-- finds no rows and deletes 0.
DELETE FROM public.enrollments;
DELETE FROM public.user_progress;
DELETE FROM public.xp_transactions;
DELETE FROM public.user_achievements;

-- ── user_xp: UPDATE-to-zero, scoped to the rows that actually carry state ──
-- The WHERE self-limits to the 2 active rows and can NEVER reach the 73 pristine
-- signup rows, and it makes the statement idempotent (once zeroed, it matches 0
-- rows on re-apply). streak_freezes is INTENTIONALLY preserved as-is (0 for
-- every row today; it is the earned freeze inventory, not chain-mirrored XP —
-- owner decision to leave it untouched). Setting current_streak and
-- longest_streak together to 0 satisfies chk_user_xp_longest_gte_current.
UPDATE public.user_xp
SET total_xp           = 0,
    level              = 0,
    current_streak     = 0,
    longest_streak     = 0,
    last_activity_date = NULL
WHERE total_xp > 0
   OR level > 0
   OR current_streak > 0
   OR longest_streak > 0
   OR last_activity_date IS NOT NULL;

-- ── Assertions — roll the whole batch back if any invariant is violated ──
DO $$
DECLARE
  b            RECORD;
  v_active     INTEGER;
  v_profiles   INTEGER;
  v_auth       INTEGER;
  v_user_xp    INTEGER;
  v_certs      INTEGER;
BEGIN
  SELECT * INTO b FROM _cleanup_baseline;

  -- Baseline guard: the posted dry-run evidence this migration was written
  -- against. A mismatch means the DB drifted (e.g. new signups) — STOP and
  -- reconcile against fresh counts rather than run on stale assumptions.
  IF b.profiles <> 75 THEN
    RAISE EXCEPTION 'profiles baseline drifted: expected 75 (posted #607), got %. Re-run the DRY-RUN counts and reconcile before applying.', b.profiles;
  END IF;
  IF b.user_xp <> 75 THEN
    RAISE EXCEPTION 'user_xp baseline drifted: expected 75 (== profiles), got %. Re-run the DRY-RUN counts before applying.', b.user_xp;
  END IF;
  IF b.certificates <> 4 THEN
    RAISE EXCEPTION 'certificates baseline drifted: expected 4 (posted #607), got %. certificates is EXCLUDED — investigate before applying.', b.certificates;
  END IF;

  -- NEVER-TOUCH invariant: profiles and auth.users unchanged across the batch.
  SELECT count(*) INTO v_profiles FROM public.profiles;
  SELECT count(*) INTO v_auth     FROM auth.users;
  IF v_profiles <> b.profiles THEN
    RAISE EXCEPTION 'profiles row count changed (% -> %): this migration must never touch profiles', b.profiles, v_profiles;
  END IF;
  IF v_auth <> b.auth_users THEN
    RAISE EXCEPTION 'auth.users row count changed (% -> %): this migration must never touch auth users', b.auth_users, v_auth;
  END IF;

  -- EXCLUDED invariant: certificates untouched.
  SELECT count(*) INTO v_certs FROM public.certificates;
  IF v_certs <> b.certificates THEN
    RAISE EXCEPTION 'certificates row count changed (% -> %): certificates is EXCLUDED from this cleanup', b.certificates, v_certs;
  END IF;

  -- UPDATE-not-DELETE invariant: user_xp keeps every row (still 1:1 with
  -- profiles). If this fired, a DELETE reached user_xp — the exact mistake the
  -- 🔴 note exists to prevent.
  SELECT count(*) INTO v_user_xp FROM public.user_xp;
  IF v_user_xp <> b.user_xp THEN
    RAISE EXCEPTION 'user_xp row count changed (% -> %): user_xp must be UPDATED to zero, NEVER deleted', b.user_xp, v_user_xp;
  END IF;

  -- Reset invariant: no user_xp row carries state after the UPDATE (proves the
  -- 2 active rows were zeroed; also confirms idempotent re-runs are no-ops).
  SELECT count(*) INTO v_active FROM public.user_xp
  WHERE total_xp > 0 OR level > 0 OR current_streak > 0
     OR longest_streak > 0 OR last_activity_date IS NOT NULL;
  IF v_active <> 0 THEN
    RAISE EXCEPTION 'user_xp still has % row(s) with non-zero state after reset', v_active;
  END IF;

  RAISE NOTICE 'stranded-instance cleanup OK: profiles=% (untouched), auth.users=% (untouched), certificates=% (excluded, untouched), user_xp=% rows all zeroed', v_profiles, v_auth, v_certs, v_user_xp;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK — NONE. This migration is DESTRUCTIVE and NOT reversible.
-- ----------------------------------------------------------------------------
-- There is deliberately no rollback block. The deleted enrollments /
-- user_progress / xp_transactions / user_achievements rows and the overwritten
-- user_xp XP/streak values are GONE at COMMIT; nothing in the repo or this file
-- can restore them (the #750 lesson: a rollback that cannot reproduce the prior
-- state must not pretend to). If a restore is ever required, it must come from a
-- point-in-time / PITR database backup taken BEFORE this migration — capture one
-- first if that possibility matters to the operator.
--
-- Recovery is by the owner's design decision (2026-07-25): "resetting progress
-- is recoverable." Learners simply redo the affected activity against the live
-- program (Dsro2Cd9), and XP/streaks re-accrue once the reward loop is repointed
-- (the Helius webhook fix on #607). No identity is lost (profiles / auth.users
-- untouched) and no credential is lost (certificates excluded).
-- ============================================================================
