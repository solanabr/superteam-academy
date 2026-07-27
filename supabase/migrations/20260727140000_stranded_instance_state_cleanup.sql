-- ============================================================================
-- Migration: reset the chain-mirrored learner state stranded by the program
-- move (Dsro2Cd9 is live; the DB still mirrors the superseded 7NeJa instance).
-- Task: #607 (P0)  [area:onchain][area:db]  — reset-wave pattern (cf. #356)
-- ----------------------------------------------------------------------------
-- ⚠️  certificates IS EXCLUDED. It is NOT reset here (owner decision:
--     "investigate separately"). Its 4 rows are Metaplex Core assets that may
--     still exist in a wallet, so the DB row can be the only surviving record
--     of a real credential. This migration never writes certificates and
--     asserts its row count is unchanged. profiles, auth.users and
--     deployed_programs are likewise NEVER TOUCHED — each asserted unchanged at
--     COMMIT (deployed_programs now holds its first real row, the #725 proof).
--
-- OUT OF SCOPE (considered, intentionally not touched): streak_freezes_used
-- (the per-day freeze calendar log, keyed (user_id, frozen_date)). It is not
-- chain-mirrored XP, and a stale stranded-era row cannot collide with a future
-- date, so leaving it is harmless; user_xp.streak_freezes is likewise preserved.
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
-- xp_transactions total; the LATEST stranded row is 2026-07-16, giving ~5 days
-- of margin below the boundary. So it cleanly separates stranded (pre-move) rows
-- from live (post-move) rows. Each of the five statements (four DELETEs + the
-- user_xp UPDATE) carries the era predicate, scoped on its own creation
-- timestamp (all reliable — see below); the pre-DELETE assert re-checks that the
-- era-scoped count still equals the posted value, so a wrong boundary or a live
-- row inside the window ABORTS rather than deletes/zeroes the wrong rows.
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
-- 🔴 user_xp IS 1:1 WITH profiles — UPDATE (era-scoped), NEVER DELETE. Unlike
-- the other four tables (rows for 2 users), user_xp has a row for EVERY learner:
-- a row is created at signup regardless of activity, most of them pristine zeros
-- belonging to last week's event cohort. A `DELETE FROM user_xp` — the shape
-- that is correct for the other four — would remove all those pristine rows,
-- adjacent to the exact constraint this issue protects. So user_xp gets a
-- WHERE-scoped UPDATE, and the WHERE carries BOTH the state chain (keeps it off
-- the pristine rows) AND the era clause `last_activity_date < '2026-07-21'`
-- (keeps it off VALID POST-MOVE learners — since the move, real learners have
-- earned XP on the new instance, e.g. the #725 test learner's 1070 XP dated
-- 2026-07-27; without the era clause the state chain alone would zero them).
-- The stranded-active rows are frozen (≤ 2026-07-16), so this targets IN (0, 2)
-- rows, asserted pre-flight. The post-apply assert pins user_xp's row count
-- unchanged (== before), enforcing "never deleted from" structurally.
--
-- DRY-RUN COUNTS (gate, prod pywhtmidcrptomrabbrw; posted #607 2026-07-27, and
-- already drifted to 76/76 by 2026-07-27 evening as signups + the #725 test
-- landed). This is why NO absolute live-count pin is used: the assert blocks pin
-- only the FROZEN era counts (7/63/16/7 delete targets, 2 stranded-active
-- user_xp rows) and the drift-immune before==after never-touch invariants — so
-- concurrent signups can't spuriously abort. RE-VERIFY the era counts against
-- the live DB BEFORE applying; a drift there fails the migration and forces
-- reconciliation. Re-run:
--
--   -- era-scoped delete targets (must match the DELETE WHERE clauses below):
--   select 'enrollments' t, count(*) from enrollments       where enrolled_at  < '2026-07-21'
--   union all select 'user_progress', count(*) from user_progress   where completed_at < '2026-07-21'
--   union all select 'xp_transactions', count(*) from xp_transactions where created_at   < '2026-07-21'
--   union all select 'user_achievements', count(*) from user_achievements where unlocked_at < '2026-07-21';
--   -- expected: enrollments 7 · user_progress 63 · xp_transactions 16 · user_achievements 7
--
--   -- sanity: the posted UNCONDITIONAL counts were the same before #725 ran;
--   -- after #725/new signups the unconditional counts are HIGHER (live rows),
--   -- but the era-scoped counts above must be unchanged.
--
--   -- stranded-active user_xp (the ONLY rows the era-scoped UPDATE may zero):
--   select count(*) from user_xp
--   where last_activity_date < '2026-07-21'
--     and (total_xp > 0 OR level > 0 OR current_streak > 0 OR longest_streak > 0);
--   -- expected: 2 (frozen). A NULL-dated row with state must NOT exist:
--   select count(*) from user_xp
--   where last_activity_date IS NULL
--     and (total_xp > 0 OR level > 0 OR current_streak > 0 OR longest_streak > 0);
--   -- expected: 0.
--
--   -- never-touch / excluded tables (asserted before==after, NOT pinned to an
--   -- absolute value — they drift with signups): note the live totals so you can
--   -- confirm they are unchanged post-apply.
--   select 'profiles' t, count(*) from profiles
--   union all select 'auth.users', count(*) from auth.users
--   union all select 'certificates', count(*) from certificates
--   union all select 'deployed_programs', count(*) from deployed_programs;
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
  (SELECT count(*) FROM public.user_achievements WHERE unlocked_at  < '2026-07-21') AS ach_era,
  -- NULL-anchor counts: none of the four timestamp columns is NOT NULL, so a
  -- NULL anchor would slip past the era predicate (NULL < date → UNKNOWN) and
  -- survive as a silent orphan. Verified unreachable via every current writer,
  -- but this migration is an irreversible wipe, so a NULL is an ABORT-for-
  -- inspection signal, not a silent skip.
  (SELECT count(*) FROM public.enrollments       WHERE enrolled_at  IS NULL) AS enr_null,
  (SELECT count(*) FROM public.user_progress     WHERE completed_at IS NULL) AS up_null,
  (SELECT count(*) FROM public.xp_transactions   WHERE created_at   IS NULL) AS xp_null,
  (SELECT count(*) FROM public.user_achievements WHERE unlocked_at  IS NULL) AS ach_null,
  -- deployed_programs: a NEVER-TOUCH table like profiles/auth.users. It now
  -- holds its first real row (the #725 proof); this migration never writes it
  -- and asserts the count is unchanged across the batch.
  (SELECT count(*) FROM public.deployed_programs) AS deployed_programs,
  -- user_xp era counts. uxp_active_era = stranded-era rows still carrying state
  -- (the era-scoped UPDATE's exact targets: frozen at ≤ 2026-07-16, so IN(0,2)).
  -- uxp_null_state = rows with state but a NULL activity date — impossible by
  -- construction (award_xp always stamps last_activity_date), verified because
  -- the era clause is NULL-blind and this is an irreversible reset.
  (SELECT count(*) FROM public.user_xp
     WHERE last_activity_date < '2026-07-21'
       AND (total_xp > 0 OR level > 0 OR current_streak > 0 OR longest_streak > 0)) AS uxp_active_era,
  (SELECT count(*) FROM public.user_xp
     WHERE last_activity_date IS NULL
       AND (total_xp > 0 OR level > 0 OR current_streak > 0 OR longest_streak > 0)) AS uxp_null_state;

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

  -- NULL-anchor guard: a NULL timestamp is invisible to the era predicate, so a
  -- NULL-anchored row (should be impossible via every current writer) would
  -- silently survive this irreversible wipe as an orphan. Expect 0; ABORT for
  -- operator inspection otherwise — never a silent skip.
  IF b.enr_null <> 0 THEN
    RAISE EXCEPTION 'enrollments has % row(s) with NULL enrolled_at — invisible to the era filter. Inspect and reconcile before applying.', b.enr_null;
  END IF;
  IF b.up_null <> 0 THEN
    RAISE EXCEPTION 'user_progress has % row(s) with NULL completed_at — invisible to the era filter. Inspect and reconcile before applying.', b.up_null;
  END IF;
  IF b.xp_null <> 0 THEN
    RAISE EXCEPTION 'xp_transactions has % row(s) with NULL created_at — invisible to the era filter. Inspect and reconcile before applying.', b.xp_null;
  END IF;
  IF b.ach_null <> 0 THEN
    RAISE EXCEPTION 'user_achievements has % row(s) with NULL unlocked_at — invisible to the era filter. Inspect and reconcile before applying.', b.ach_null;
  END IF;

  -- user_xp pre-flight (same discipline as the DELETE tables):
  -- • stranded-active rows are frozen (≤ 2026-07-16) so the era-scoped UPDATE
  --   targets exactly IN (0, 2) rows; anything else means a post-move learner
  --   fell inside the window or the boundary drifted — ABORT.
  -- • a state-bearing row with a NULL activity date cannot exist (award_xp
  --   always stamps last_activity_date), but the era clause is NULL-blind, so
  --   verify it and ABORT rather than silently skip on an irreversible reset.
  IF b.uxp_active_era NOT IN (0, 2) THEN
    RAISE EXCEPTION 'user_xp stranded-active count (state AND last_activity_date < 2026-07-21) = % — expected 2 (first apply) or 0 (re-apply). A post-move learner must NOT fall in this window; re-verify before applying.', b.uxp_active_era;
  END IF;
  IF b.uxp_null_state <> 0 THEN
    RAISE EXCEPTION 'user_xp has % row(s) with state but NULL last_activity_date — invisible to the era clause. Inspect before applying (award_xp should make this impossible).', b.uxp_null_state;
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

-- ── user_xp: UPDATE-to-zero, ERA-SCOPED to stranded-active rows ──
-- Two clauses, both load-bearing:
--   • the state chain (total_xp > 0 OR …) keeps the UPDATE off the 73 pristine
--     signup rows and makes it idempotent (once zeroed it matches 0 rows);
--   • AND last_activity_date < '2026-07-21' confines it to STRANDED-era rows, so
--     it can NEVER zero a valid post-move learner (e.g. the #725 test learner's
--     1070 XP, activity 2026-07-27). This is the same era discipline as the
--     DELETEs — user_xp was the last statement still living in the pre-drift
--     world (round-3 gate catch).
-- NULL reasoning: pristine rows have last_activity_date IS NULL → the era clause
-- (NULL < date → UNKNOWN) excludes them → correct, they need no reset. And a
-- state-bearing row with a NULL date cannot exist (award_xp always stamps
-- last_activity_date on award) — verified by the pre-flight uxp_null_state
-- assert above, so the era clause being the sole anchor is safe by construction.
-- streak_freezes is INTENTIONALLY preserved as-is (0 for every row; the earned
-- freeze inventory, not chain-mirrored XP). Setting current_streak and
-- longest_streak together to 0 satisfies chk_user_xp_longest_gte_current.
UPDATE public.user_xp
SET total_xp           = 0,
    level              = 0,
    current_streak     = 0,
    longest_streak     = 0,
    last_activity_date = NULL
WHERE (
       total_xp > 0
    OR level > 0
    OR current_streak > 0
    OR longest_streak > 0
    OR last_activity_date IS NOT NULL
  )
  AND last_activity_date < '2026-07-21';

-- ── Post-apply assertions — roll the whole batch back if any invariant fails ──
DO $$
DECLARE
  b            RECORD;
  v_active     INTEGER;
  v_profiles   INTEGER;
  v_auth       INTEGER;
  v_user_xp    INTEGER;
  v_certs      INTEGER;
  v_deployed   INTEGER;
  v_enr        INTEGER;
  v_up         INTEGER;
  v_xp         INTEGER;
  v_ach        INTEGER;
BEGIN
  SELECT * INTO b FROM _cleanup_baseline;

  -- No absolute live-count pins here (round-3 gate). profiles/user_xp/
  -- certificates are LIVE counts that grow with every signup (already 76/76 by
  -- apply time), so pinning them to the 2026-07-27 dry-run values would make the
  -- migration go stale the moment anyone signs up — reintroducing the very race
  -- era-scoping removes. The frozen numbers that DO deserve pins are the era
  -- counts (asserted pre-DELETE). The never-touch tables are proved by the
  -- before==after invariants below, which are drift-immune.

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

  -- NEVER-TOUCH invariant: deployed_programs unchanged (it now holds the #725
  -- proof row; this migration never writes it). Gate ask.
  SELECT count(*) INTO v_deployed FROM public.deployed_programs;
  IF v_deployed <> b.deployed_programs THEN
    RAISE EXCEPTION 'deployed_programs row count changed (% -> %): this migration must never touch deployed_programs', b.deployed_programs, v_deployed;
  END IF;

  -- UPDATE-not-DELETE invariant: user_xp keeps every row (still 1:1 with
  -- profiles). If this fired, a DELETE reached user_xp — the exact mistake the
  -- 🔴 note exists to prevent.
  SELECT count(*) INTO v_user_xp FROM public.user_xp;
  IF v_user_xp <> b.user_xp THEN
    RAISE EXCEPTION 'user_xp row count changed (% -> %): user_xp must be UPDATED to zero, NEVER deleted', b.user_xp, v_user_xp;
  END IF;

  -- Reset invariant (ERA-SCOPED): no STRANDED-ERA row still carries state after
  -- the UPDATE. It must NOT demand universal zeroing — a valid post-move learner
  -- legitimately keeps state, and pinning "0 rows carry state" would abort the
  -- txn the moment one exists (round-3 gate catch). The reset rows now have
  -- last_activity_date = NULL, so they fall outside this window too; a stranded
  -- row the UPDATE somehow missed would still be < boundary AND carry state.
  SELECT count(*) INTO v_active FROM public.user_xp
  WHERE last_activity_date < '2026-07-21'
    AND (total_xp > 0 OR level > 0 OR current_streak > 0 OR longest_streak > 0);
  IF v_active <> 0 THEN
    RAISE EXCEPTION 'user_xp: % stranded-era row(s) still carry state after reset', v_active;
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

  RAISE NOTICE 'stranded-instance cleanup OK: deleted pre-move rows (enr % / up % / xp % / ach %), zeroed % stranded-active user_xp row(s); untouched: profiles=%, auth.users=%, certificates=%, deployed_programs=%, user_xp rowcount=%', b.enr_era, b.up_era, b.xp_era, b.ach_era, b.uxp_active_era, v_profiles, v_auth, v_certs, v_deployed, v_user_xp;
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
