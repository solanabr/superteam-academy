-- ============================================================================
-- Migration: course_changelog status/recreate kinds (#738)
--
-- #654 (20260726210000_course_changelog.sql) captured changelog entries only in
-- the admin sync route, on the premise that it was "the sole mutator of a
-- course's on-chain state". It was not: `api/admin/courses/deactivate`,
-- `api/admin/courses/reactivate`, and the close+recreate
-- (`lib/admin/recreate-course.ts`) also mutate on-chain course state and wrote
-- nothing. This migration widens the `kind` CHECK so those mutators can record:
--   * deactivated — is_active → false (the path #713 retires 5 courses with)
--   * reactivated — is_active → true
--   * recreated   — close_course + create_course (the account rebuild, WS-2)
--
-- The original CHECK was an inline column constraint, so Postgres named it
-- `course_changelog_kind_check`. We DROP that (IF EXISTS) and re-ADD a
-- same-named constraint listing all eight kinds — idempotent: re-running drops
-- the constraint we just added and re-creates it identically.
--
-- No new columns, indexes, RLS, or policies: the #654 table shape, the
-- fail-closed SELECT policy (synced+active only), and the service_role-only
-- write model all stay exactly as they are. Deactivated entries are therefore
-- written but not publicly readable until the course is reactivated — see the
-- #738 discussion on why surfacing a retired course's log to enrolled learners
-- is deferred (it needs un-gating the course page, not just the RLS).
--
-- Idempotent; explicit BEGIN/COMMIT. Tested ROLLBACK block at the bottom.
-- Mirrored into supabase/schema.sql (the inline CHECK there now lists all eight).
-- ============================================================================

BEGIN;

ALTER TABLE public.course_changelog
  DROP CONSTRAINT IF EXISTS course_changelog_kind_check;

ALTER TABLE public.course_changelog
  ADD CONSTRAINT course_changelog_kind_check CHECK (kind IN (
    'deployed',
    'lessons_added',
    'lessons_removed',
    'xp_changed',
    'content_updated',
    'deactivated',
    'reactivated',
    'recreated'
  ));

COMMIT;

-- ============================================================================
-- ROLLBACK (tested; not executed by the migration runner)
-- ----------------------------------------------------------------------------
-- Reverts to the #654 five-kind CHECK. Safe only if no row uses a new kind.
-- BEGIN;
--   ALTER TABLE public.course_changelog
--     DROP CONSTRAINT IF EXISTS course_changelog_kind_check;
--   ALTER TABLE public.course_changelog
--     ADD CONSTRAINT course_changelog_kind_check CHECK (kind IN (
--       'deployed', 'lessons_added', 'lessons_removed', 'xp_changed',
--       'content_updated'
--     ));
-- COMMIT;
-- ============================================================================
