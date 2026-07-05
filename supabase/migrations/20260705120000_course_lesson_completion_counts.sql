-- Migration: course_lesson_completion_counts
-- The teacher analytics funnel (#286) needs per-lesson completion counts. The
-- app previously SELECTed raw completed `user_progress` rows and counted them in
-- JS — which PostgREST silently truncates at max_rows (1000), under-reporting
-- the funnel bars AND xpAwarded for busy courses (e.g. 150 learners × 10
-- lessons > 1000 rows). Aggregate in Postgres instead: this returns ONE row per
-- lesson (far under the cap), counted by the database, so the count is exact.
--
-- SECURITY DEFINER so it aggregates across all learners regardless of RLS; it
-- returns only non-sensitive counts (lesson_id + a count), never learner rows.
-- Ownership of the course is verified by the caller (teacher analytics path)
-- before invoking this via the service-role client; EXECUTE is granted to
-- service_role only, mirroring the other SECURITY DEFINER functions.
CREATE OR REPLACE FUNCTION public.course_lesson_completion_counts(p_course_id TEXT)
RETURNS TABLE (lesson_id TEXT, completed_by BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT up.lesson_id, COUNT(*)::bigint
  FROM public.user_progress up
  WHERE up.course_id = p_course_id AND up.completed = true
  GROUP BY up.lesson_id;
$$;

REVOKE ALL ON FUNCTION public.course_lesson_completion_counts(TEXT)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.course_lesson_completion_counts(TEXT)
  TO service_role;
