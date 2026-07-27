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
-- zero and clean up the DB.
--
-- 🟠 SAFETY IS BY ERA BOUNDARY, NOT "the webhook is dark". An earlier draft of
-- this migration argued the reset was safe because XP/achievements are
-- webhook-driven and the Helius webhook still points at the old program. That
-- argument is FALSE for user_progress: /api/lessons/complete
-- (lessons/complete/route.ts) upserts user_progress DIRECTLY, independent of the
-- webhook, so a live completion after the move lands a real post-move row. The
-- gate's #725 end-to-end test created exactly such rows (enroll → completions →
-- XP on Dsro2Cd9) AFTER the dry-run counts were posted. A full-table
-- `DELETE FROM user_progress` would have destroyed them.
--
-- So every DELETE is ERA-SCOPED to rows created BEFORE the move, and no reset is
-- justified by the webhook being dark. Anything at/after the boundary is live
-- and survives untouched.
--
-- 🔵 ERA BOUNDARY = '2026-07-21' (the Dsro2Cd9 deploy date, a fresh Pinocchio
-- instance). PROVENANCE: the gate's #607 dry-run cross-check counted
-- `xp_transactions where created_at < '2026-07-21'` and it reproduced the posted
-- xp_transactions total — so this boundary cleanly separates stranded (pre-move)
-- rows from live (post-move) rows. Each of the four tables is scoped on its own
-- creation timestamp (all reliable — see below); the pre-DELETE assert re-checks
-- that the era-scoped count still equals the posted value, so a wrong boundary
-- or a live row inside the window ABORTS rather than deletes the wrong rows.
--
--   table              scope column     why it is a reliable creation anchor
--   enrollments        enrolled_at      TIMESTAMPTZ DEFAULT NOW(), non-null
--   user_progress      completed_at     every writer (route:575, batch-complete,
--                                        resync, webhook) sets completed:true +
--                                        completed_at; no path inserts a NULL
--   xp_transactions    created_at       TIMESTAMPTZ DEFAULT NOW(); the exact
--                                        column the gate's cross-check used
--   user_achievements  unlocked_at      TIMESTAMPTZ DEFAULT NOW(), non-null
--
-- WHAT THIS DOES. Reset ONLY chain-mirrored, pre-move state:
--   • enrollments, user_progress, xp_transactions, user_achievements —
--     ERA-SCOPED DELETE (WHERE <ts> < '2026-07-21'); the posted counts are all
--     2 users / 7·63·16·7 rows, all pre-move.
--   • user_xp — UPDATE-to-zero, NEVER DELETE (see the 🔴 note).
--
-- 🔴 user_xp IS 1:1 WITH profiles — UPDATE, NEVER DELETE. Unlike the other four
-- tables (rows for 2 users), user_xp has a row for ALL 75 learners: a row is
-- created at signup regardless of activity. 73 of those are pristine zeros
-- belonging to last week's event cohort. A `DELETE FROM user_xp` — the shape
-- that is correct for the other four — would remove 73 rows with nothing to
-- reset, a blast radius 37× the real target, adjacent to the exact constraint
-- this issue protects. So user_xp gets a WHERE-scoped UPDATE that touches
-- EXACTLY the 2 rows carrying state and cannot reach the 73 pristine ones. It
-- is NOT era-scoped: user_xp is cumulative, not per-event, so "zero the active
-- rows" is the reset — and the 2 active rows are the same stranded learners
-- (no XP has been awarded on the new instance to anyone else). The post-apply
-- assert pins user_xp's row count unchanged (== profiles), enforcing "never
-- deleted from" structurally.
--
-- DRY-RUN COUNTS (gate, prod pywhtmidcrptomrabbrw, posted on #607 2026-07-27).
-- RE-VERIFY these against the live DB BEFORE applying — the assert blocks pin
-- the era-scoped delete counts (7/63/16/7) and profiles=75 / user_xp=75 /
-- certificates=4, so a drift fails the migration and forces reconciliation
-- rather than running against stale evidence. Re-run:
--
--   -- era-scoped delete targets (must match the DELETE WHERE clauses below):
--   select 'enrollments' t, count(*) from enrollments       where enrolled_at  < '2026-07-21'
--   union all select 'user_progress', count(*) from user_progress   where completed_at < '2026-07-21'
--   union all select 'xp_transactions', count(*) from xp_transactions where created_at   < '2026-07-21'
--   union all select 'user_achievements', count(*) from user_achievements where unlocked_at < '2026-07-21';
--   -- expected: enrollments 7 · user_progress 63 · xp_transactions 16 · user_achievements 7
--
--   -- sanity: the posted UNCONDITIONAL counts were the same before #725 ran;
--   -- after #725 the unconditional counts may be HIGHER (live rows) but the
--   -- era-scoped counts above must be unchanged.
--
--   select count(*) filter (where total_xp > 0 OR current_streak > 0
--       OR longest_streak > 0 OR last_activity_date IS NOT NULL) as active_rows
--   from user_xp;   -- expected: 2 (the only rows the UPDATE may touch)
--
--   select 'profiles' t, count(*) from profiles           -- expected 75 (NEVER TOUCH)
--   union all select 'auth.users', count(*) from auth.users;
--   select count(*) from certificates;                    -- expected 4 (EXCLUDED)
--
-- Idempotent: the era-scoped DELETEs re-run to 0 rows (nothing pre-move
-- remains); the UPDATE's WHERE matches 0 rows once state is zeroed. Safe to
-- re-apply (re-apply is a no-op). One explicit BEGIN/COMMIT so the whole file
-- is a single transaction under a manual apply and every assert can roll the
-- batch back atomically.
--
-- schema.sql is NOT touched: this is a DATA-only migration (DML, no DDL). The
-- schema.sql snapshot carries structure, not rows, so there is nothing to
-- mirror (cf. the data-only precedents 20260630165536 / 20260703150000). The
-- guard test pins the era-scoped-DELETE, UPDATE-not-DELETE and never-touch
-- invariants against this file directly.
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

-- Snapshot the must-not-touch / excluded baselines AND the era-scoped delete
-- counts inside the transaction so the asserts can prove exactly what moved (ON
-- COMMIT DROP: temp, no residue). Captured BEFORE any DML.
CREATE TEMP TABLE _cleanup_baseline ON COMMIT DROP AS
SELECT
  (SELECT count(*) FROM public.profiles)     AS profiles,
  (SELECT count(*) FROM auth.users)          AS auth_users,
  (SELECT count(*) FROM public.user_xp)      AS user_xp,
  (SELECT count(*) FROM public.certificates) AS certificates,
  (SELECT count(*) FROM public.enrollments       WHERE enrolled_at  < '2026-07-21') AS enr_era,
  (SELECT count(*) FROM public.user_progress     WHERE completed_at < '2026-07-21') AS up_era,
  (SELECT count(*) FROM public.xp_transactions   WHERE created_at   < '2026-07-21') AS xp_era,
  (SELECT count(*) FROM public.user_achievements WHERE unlocked_at  < '2026-07-21') AS ach_era;

-- ── Pre-DELETE structural guard ──
-- Each era-scoped count must equal its posted value (first apply) OR 0 (already
-- applied) — this preserves idempotency AND aborts on any drift: a live row
-- that fell inside the era window, or a boundary that no longer reproduces the
-- posted count, stops the batch before a single row is deleted.
DO $$
DECLARE b RECORD;
BEGIN
  SELECT * INTO b FROM _cleanup_baseline;
  IF b.enr_era NOT IN (0, 7) THEN
    RAISE EXCEPTION 'enrollments era-count (enrolled_at < 2026-07-21) = % — expected 7 (first apply) or 0 (re-apply). Re-run the DRY-RUN counts and reconcile the boundary before applying.', b.enr_era;
  END IF;
  IF b.up_era NOT IN (0, 63) THEN
    RAISE EXCEPTION 'user_progress era-count (completed_at < 2026-07-21) = % — expected 63 or 0. A live post-move row must NOT fall in this window; re-verify before applying.', b.up_era;
  END IF;
  IF b.xp_era NOT IN (0, 16) THEN
    RAISE EXCEPTION 'xp_transactions era-count (created_at < 2026-07-21) = % — expected 16 or 0. Re-verify before applying.', b.xp_era;
  END IF;
  IF b.ach_era NOT IN (0, 7) THEN
    RAISE EXCEPTION 'user_achievements era-count (unlocked_at < 2026-07-21) = % — expected 7 or 0. Re-verify before applying.', b.ach_era;
  END IF;
END $$;

-- ── Reset chain-mirrored state (ERA-SCOPED DELETEs — post-move rows survive) ──
-- Maps to the dry-run counts: enrollments 7 · user_progress 63 ·
-- xp_transactions 16 · user_achievements 7 (all 2 users, all pre-move).
-- Idempotent: a re-run finds no pre-move rows and deletes 0.
DELETE FROM public.enrollments       WHERE enrolled_at  < '2026-07-21';
DELETE FROM public.user_progress     WHERE completed_at < '2026-07-21';
DELETE FROM public.xp_transactions   WHERE created_at   < '2026-07-21';
DELETE FROM public.user_achievements WHERE unlocked_at  < '2026-07-21';

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

-- ── Post-apply assertions — roll the whole batch back if any invariant fails ──
DO $$
DECLARE
  b            RECORD;
  v_active     INTEGER;
  v_profiles   INTEGER;
  v_auth       INTEGER;
  v_user_xp    INTEGER;
  v_certs      INTEGER;
  v_enr        INTEGER;
  v_up         INTEGER;
  v_xp         INTEGER;
  v_ach        INTEGER;
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

  -- Era-clean invariant: no pre-move row survives in any of the four reset
  -- tables (proves the era-scoped DELETEs ran). Post-move (live) rows, which are
  -- OUTSIDE this window, are deliberately not counted here and are preserved.
  SELECT count(*) INTO v_enr FROM public.enrollments       WHERE enrolled_at  < '2026-07-21';
  SELECT count(*) INTO v_up  FROM public.user_progress     WHERE completed_at < '2026-07-21';
  SELECT count(*) INTO v_xp  FROM public.xp_transactions   WHERE created_at   < '2026-07-21';
  SELECT count(*) INTO v_ach FROM public.user_achievements WHERE unlocked_at  < '2026-07-21';
  IF v_enr <> 0 OR v_up <> 0 OR v_xp <> 0 OR v_ach <> 0 THEN
    RAISE EXCEPTION 'pre-move rows survived the reset: enrollments=%, user_progress=%, xp_transactions=%, user_achievements=%', v_enr, v_up, v_xp, v_ach;
  END IF;

  RAISE NOTICE 'stranded-instance cleanup OK: deleted pre-move rows (enr % / up % / xp % / ach %); profiles=% (untouched), auth.users=% (untouched), certificates=% (excluded, untouched), user_xp=% rows all zeroed', b.enr_era, b.up_era, b.xp_era, b.ach_era, v_profiles, v_auth, v_certs, v_user_xp;
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
