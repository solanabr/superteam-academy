-- Admin Insights aggregation in one call (#1135). `getPlatformInsights` was
-- pulling raw `enrollments`, `user_progress` and `challenge_assists` rows into
-- the Node process (LIMIT 50,000 each) and folding them in JS — same shape as
-- the landing-page scan #1091 replaced with get_platform_stats(). Past the cap
-- the panel reports numbers that are simply wrong rather than erroring, which
-- is the one thing an honest-read panel must not do.
--
-- Returns a single jsonb shaped exactly like the `PlatformInsights` interface
-- in apps/web/src/lib/admin/insights.ts. The TS caller is RPC-first with the
-- old JS aggregation as a fallback, so this function and the code deploy
-- independently.
--
-- TWO INVARIANTS ARE LOAD-BEARING:
--
-- 1. SOFT-DELETED ACCOUNTS ARE EXCLUDED EVERYWHERE. POST /api/account/delete
--    tombstones a profile (`deleted_at` set) but the FK cascades never fire, so
--    that learner's enrollments/user_progress/challenge_assists rows all
--    survive. Every per-user aggregate below JOINs profiles ON deleted_at IS
--    NULL — the SQL equivalent of the deletedUserIds subtraction it replaces.
--    `deleted_at IS NULL` is the filter, NOT `is_public` (a privacy preference
--    about being listed; a private profile is still an active learner).
--
-- 2. THE TWO DAY SERIES ARE ZERO-FILLED. generate_series over the 30-day window
--    LEFT JOINed to the buckets, so an idle day is a 0 bar and not a missing
--    point — a chart that silently closes gaps misreads as continuous activity.
--
-- SECURITY DEFINER + service_role-only, mirroring get_platform_stats: the base
-- tables are own-row-only (or policy-less) under RLS and this is reached only
-- from the admin-authed /api/admin/insights route via createAdminClient().

CREATE OR REPLACE FUNCTION public.get_admin_insights()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
WITH
-- Live learners only. Every CTE below joins through this.
live AS (
  SELECT p.id FROM public.profiles p WHERE p.deleted_at IS NULL
),
-- The 30 calendar days the charts draw, oldest first.
window_days AS (
  SELECT d::date AS day
  FROM generate_series(current_date - 29, current_date, interval '1 day') AS d
),

-- ── AI tutor ────────────────────────────────────────────────────────────────
-- A refunded row can sit at 0/0; it is not evidence anyone used the tutor.
assists AS (
  SELECT ca.user_id, ca.lesson_id, ca.assists_used, ca.billed_assists
  FROM public.challenge_assists ca
  JOIN live ON live.id = ca.user_id
  WHERE ca.assists_used > 0 OR ca.billed_assists > 0
),
assist_totals AS (
  SELECT
    COUNT(DISTINCT a.user_id)::bigint         AS learners_using_ai,
    COALESCE(SUM(a.assists_used), 0)::bigint  AS total_assists,
    COALESCE(SUM(a.billed_assists), 0)::bigint AS billed_assists
  FROM assists a
),
top_lessons AS (
  SELECT
    a.lesson_id,
    SUM(a.assists_used)::bigint       AS assists,
    COUNT(DISTINCT a.user_id)::bigint AS learners
  FROM assists a
  GROUP BY a.lesson_id
  ORDER BY SUM(a.assists_used) DESC, a.lesson_id ASC
  LIMIT 10
),
-- micro-USD → USD rounded to cents, matching microUsdToUsd():
-- Math.round(micro / 10_000) / 100. micro_usd is clamped >= 0 on write, so
-- Postgres' round-half-away-from-zero and JS' round-half-up agree.
spend AS (
  SELECT
    wd.day,
    ROUND(COALESCE(l.micro_usd, 0) / 10000.0) / 100.0 AS usd,
    COALESCE(l.request_count, 0)::bigint              AS requests
  FROM window_days wd
  LEFT JOIN public.ai_spend_ledger l
    -- scope_key is pinned, not just scope: every other global-scope read pins
    -- both, and only convention (no constraint) keeps a second 'global' row
    -- from fanning this join out and double-counting the day.
    ON l.spend_day = wd.day AND l.scope = 'global' AND l.scope_key = ''
  ORDER BY wd.day
),

-- ── Learning ────────────────────────────────────────────────────────────────
-- One row per COMPLETED LESSON — user_progress is keyed (user_id, lesson_id).
-- "completions" here is lessons finished, never courses finished; the panel
-- labels it as such.
progress AS (
  SELECT up.user_id, up.course_id, up.completed_at
  FROM public.user_progress up
  JOIN live ON live.id = up.user_id
  WHERE up.completed = true
),
per_course AS (
  SELECT
    pr.course_id,
    COUNT(*)::bigint                   AS completions,
    COUNT(DISTINCT pr.user_id)::bigint AS learners
  FROM progress pr
  GROUP BY pr.course_id
  ORDER BY COUNT(*) DESC, pr.course_id ASC
),
completions_by_day AS (
  SELECT wd.day, COUNT(pr.user_id)::bigint AS count
  FROM window_days wd
  LEFT JOIN progress pr
    -- UTC day bucketing, matching the JS aggregation's ISO-string slice.
    ON (pr.completed_at AT TIME ZONE 'UTC')::date = wd.day
  GROUP BY wd.day
  ORDER BY wd.day
)

SELECT jsonb_build_object(
  'generatedAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
  'ai', jsonb_build_object(
    'learnersUsingAi', (SELECT learners_using_ai FROM assist_totals),
    'totalAssists',    (SELECT total_assists     FROM assist_totals),
    'billedAssists',   (SELECT billed_assists    FROM assist_totals),
    'topLessons', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'lessonId', tl.lesson_id,
               'assists',  tl.assists,
               'learners', tl.learners)
             ORDER BY tl.assists DESC, tl.lesson_id ASC)
      FROM top_lessons tl
    ), '[]'::jsonb),
    'spendByDay', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'day',      to_char(s.day, 'YYYY-MM-DD'),
               'usd',      s.usd,
               'requests', s.requests)
             ORDER BY s.day)
      FROM spend s
    ), '[]'::jsonb),
    'spend30dUsd', COALESCE((SELECT ROUND(SUM(s.usd), 2) FROM spend s), 0),
    'requests30d', COALESCE((SELECT SUM(s.requests)::bigint FROM spend s), 0)
  ),
  'learning', jsonb_build_object(
    'totalLearners',    (SELECT COUNT(*)::bigint FROM live),
    'totalEnrollments', (SELECT COUNT(*)::bigint FROM public.enrollments e
                           JOIN live ON live.id = e.user_id),
    'activeLearners7d', (SELECT COUNT(DISTINCT pr.user_id)::bigint FROM progress pr
                           WHERE pr.completed_at >= now() - interval '7 days'),
    'activeLearners30d', (SELECT COUNT(DISTINCT pr.user_id)::bigint FROM progress pr
                           WHERE pr.completed_at >= now() - interval '30 days'),
    'completionsByDay', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'day',   to_char(c.day, 'YYYY-MM-DD'),
               'count', c.count)
             ORDER BY c.day)
      FROM completions_by_day c
    ), '[]'::jsonb),
    'perCourse', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'courseId',    pc.course_id,
               'completions', pc.completions,
               'learners',    pc.learners)
             ORDER BY pc.completions DESC, pc.course_id ASC)
      FROM per_course pc
    ), '[]'::jsonb)
  )
);
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_insights() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_insights() TO service_role;
