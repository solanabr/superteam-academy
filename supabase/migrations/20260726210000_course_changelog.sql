-- ============================================================================
-- Migration: course_changelog — post-deployment course evolution log (#654)
--
-- Courses are MUTABLE after deployment: `update_course` can retire/rewrite the
-- 256-bit live-lesson bitmap (`active_lessons: [u64; 4]`), change
-- `xp_per_lesson`, and bump `version`/`content_tx_id` — all without closing the
-- course. Today those changes are SILENT: a learner mid-course gets no signal
-- that lessons were added or retired, and admins keep no in-app history.
--
-- DATA SOURCE — server-side capture at mutation time (NOT Helius replay).
-- The issue floats two options (index CourseUpdated events vs. read on demand).
-- We take a third, higher-fidelity path prescribed by the mutation model: the
-- admin sync route (apps/web/src/app/api/admin/courses/sync/route.ts) is the
-- ONLY writer of these on-chain changes, and at that point it already holds
-- BOTH the prior on-chain state (via fetchCourse) AND the intended new state
-- (the committed slots.lock mask + xp). The `CourseUpdated` event carries only
-- `version`/`collection`/`timestamp` — it CANNOT tell you which lesson slots
-- moved. So the route computes the human-readable diff at mutation time and
-- writes rows here (service_role), exactly as `onchain_deployments` is written
-- from the same route. Reads never touch RPC/Helius.
--
-- A changelog is an IMMUTABLE HISTORICAL record, so each row SNAPSHOTS the
-- lesson titles as they were when the change happened (in `detail`), rather
-- than resolving them from the live content bundle at read time — a lesson
-- retired long ago may no longer exist in the bundle, and even a renamed lesson
-- should read, in the log, under the name it had when it changed.
--
-- SECURITY — house pattern, learner-visible-but-scoped variant.
-- Rows carry no secrets (quiz answers/solutions live only in the server-only
-- bundle; the tx signature is already public on-chain). But the snapshotted
-- lesson TITLES must not leak for a course that isn't publicly visible — a
-- course can be on-chain-deployed yet hidden from the catalog (deactivated, or
-- synced-then-deactivated). A blanket `USING (true)` would let any anon
-- PostgREST caller enumerate every course's title history regardless of catalog
-- visibility. So the SELECT policy is FAIL-CLOSED and mirrors the catalog's own
-- visibility gate EXACTLY: a row is visible only when its course currently has a
-- `synced` AND active deployment — the same `status = 'synced' AND
-- COALESCE(is_active, true)` predicate `isSynced` (lib/content/deployments.ts)
-- applies. The EXISTS runs against `public_onchain_deployments` (the anon-
-- readable owner-privilege VIEW), NOT the base `onchain_deployments` table
-- (RLS-on/no-policy → anon sees zero rows, which would hide EVERYTHING). No
-- deployment row, unsynced, or inactive ⇒ hidden.
-- Writes: RLS is on with no INSERT/UPDATE/DELETE policy, so ONLY service_role
-- (which bypasses RLS) can write — the sync route's createAdminClient() is the
-- sole writer.
--
-- Idempotent (repo convention): CREATE TABLE/INDEX IF NOT EXISTS, DROP POLICY
-- IF EXISTS before CREATE POLICY, a UNIQUE constraint + ON CONFLICT DO NOTHING
-- at the write site so re-running a sync never double-logs. Explicit
-- BEGIN/COMMIT so the whole file is one transaction under a manual psql apply.
--
-- A tested ROLLBACK block is at the very bottom of this file.
-- Mirrored into supabase/schema.sql (the full-schema snapshot).
-- ============================================================================

BEGIN;

-- ── course_changelog ────────────────────────────────────────────────────────
-- One row per (mutation, change-kind). A single sync can add lessons AND change
-- xp; that produces two rows sharing a `tx_signature` and `version`, so the UI
-- renders both under one dated update. `course_id` is the content `_id`
-- verbatim (PDA-seed convention: never strip/transform ids). `detail` carries
-- the kind-specific payload (lesson snapshots, xp from/to, content sha).
CREATE TABLE IF NOT EXISTS public.course_changelog (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id    TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN (
                 'deployed',
                 'lessons_added',
                 'lessons_removed',
                 'xp_changed',
                 'content_updated'
               )),
  -- On-chain `course.version` AFTER the change (bumps only when content_tx_id
  -- changes; an xp-only update keeps the prior version — informational).
  version      INTEGER NOT NULL,
  -- Kind-specific, title-snapshotted payload. Never resolved from the live
  -- bundle at read time (a retired lesson may be gone from it).
  detail       JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- The on-chain signature for this mutation (public data). NOT NULL: it is the
  -- dedup key, and Postgres treats NULLs as DISTINCT in a UNIQUE — a nullable
  -- column would silently defeat the idempotency guard below. Every writer has
  -- a confirmed signature (a mutation with none never reaches capture).
  tx_signature TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Re-running the same sync (same tx) must not double-log: one row per
  -- (course, kind, tx). With tx_signature NOT NULL, this UNIQUE fully
  -- determines conflicts, so ON CONFLICT DO NOTHING at the write site is exact.
  CONSTRAINT course_changelog_dedup UNIQUE (course_id, kind, tx_signature)
);

-- Course-page read: newest-first entries for one course.
CREATE INDEX IF NOT EXISTS idx_course_changelog_course_created
  ON public.course_changelog (course_id, created_at DESC);

-- ── RLS: public read, service_role-only write ───────────────────────────────
ALTER TABLE public.course_changelog ENABLE ROW LEVEL SECURITY;

-- Scoped read: visible only for a course that is currently synced AND active —
-- the SAME gate the catalog applies (isSynced). Fail-closed: a hidden/
-- deactivated course's title history never leaks to an anon PostgREST caller.
-- The EXISTS targets the anon-readable VIEW (owner-privilege), not the base
-- table (RLS-on/no-policy would make this subquery see nothing → hide all).
DROP POLICY IF EXISTS "Course changelog is viewable by everyone" ON public.course_changelog;
DROP POLICY IF EXISTS "Course changelog visible for synced-active courses" ON public.course_changelog;
CREATE POLICY "Course changelog visible for synced-active courses"
  ON public.course_changelog FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.public_onchain_deployments d
      WHERE d.content_id = course_changelog.course_id
        AND d.kind = 'course'
        AND d.status = 'synced'
        AND COALESCE(d.is_active, true)
    )
  );
-- NO write policy: writes only via service_role (bypasses RLS) from the admin
-- sync route. An INSERT/UPDATE/DELETE policy here would open a client forge path.

COMMIT;

-- ============================================================================
-- ROLLBACK (tested; not executed by the migration runner)
-- ----------------------------------------------------------------------------
-- BEGIN;
--   DROP TABLE IF EXISTS public.course_changelog;
-- COMMIT;
-- ============================================================================
