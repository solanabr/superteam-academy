-- ============================================================================
-- Migration: perf — completion counts / leaderboard / siws_nonces
--
-- CONTEXT AND HONEST SCOPE. Sentry reported `course_lesson_completion_counts`
-- at p75 38 s / p95 222 s, `get_leaderboard` p95 182 s and the siws_nonces
-- DELETE p95 185 s. None of that time is spent in Postgres. Measured on prod
-- (pg_stat_statements, 30 d window):
--
--   get_platform_stats()               48,830 calls  mean  6.6 ms  max  179 ms
--   course_lesson_completion_counts()   1,894 calls  mean 11.0 ms  max   68 ms
--   get_leaderboard()                   1,469 calls  mean 10.8 ms  max  214 ms
--   DELETE siws_nonces (both variants)    671 calls  mean  0.1 ms  max    5 ms
--
-- and the PostgREST login role carries `statement_timeout = 8s` /
-- `lock_timeout = 8s`, so a statement reaching 38 s through /rest/v1 is not
-- possible. The multi-minute spans are the Vercel→Supabase fetch hanging
-- ("TypeError: fetch failed"), which the app half of this change bounds and
-- contains. This file is therefore NOT the fix for the p95s — it removes the
-- scans and replans that would turn today's 10 ms into tomorrow's 10 s as the
-- tables grow, and it gives each of the four queries an index that matches it.
--
-- Grants are unchanged: the two service_role-only RPCs stay service_role-only,
-- get_leaderboard stays anon/authenticated-readable. No structural change to
-- profiles or auth.users.
--
-- Idempotent: CREATE INDEX IF NOT EXISTS + CREATE OR REPLACE FUNCTION.
-- ============================================================================

-- ── 1. course_lesson_completion_counts ──────────────────────────────────────
--
-- Before (prod, course-solana-speedrun, 274 completed rows of 411):
--   HashAggregate (actual time=0.295..0.297 rows=4)
--     -> Seq Scan on user_progress  (actual time=0.023..0.207 rows=274)
--          Filter: (completed AND (course_id = '...'))
--          Rows Removed by Filter: 137
--   Buffers: shared hit=13   Execution Time: 0.455 ms
--
-- The existing idx_user_progress_course_id is (course_id) only, so the planner
-- prefers a seq scan and the aggregate has to visit the heap for lesson_id.
-- A partial covering index on (course_id, lesson_id) WHERE completed turns this
-- into an index-only scan whose cost is proportional to the course's completed
-- rows instead of to the whole table.
CREATE INDEX IF NOT EXISTS idx_user_progress_course_lesson_completed
  ON public.user_progress (course_id, lesson_id)
  WHERE completed;

-- PARALLEL SAFE: pure reads of ordinary tables, no temp-table or sequence
-- access, so the aggregate may be parallelised once the table warrants it.
-- (The body is unchanged; declaring it is the point.)
CREATE OR REPLACE FUNCTION public.course_lesson_completion_counts(p_course_id TEXT)
RETURNS TABLE (lesson_id TEXT, completed_by BIGINT)
LANGUAGE sql
STABLE
PARALLEL SAFE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT up.lesson_id, COUNT(*)::bigint
  FROM public.user_progress up
  WHERE up.course_id = p_course_id AND up.completed = true
  GROUP BY up.lesson_id;
$$;

REVOKE ALL ON FUNCTION public.course_lesson_completion_counts(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.course_lesson_completion_counts(TEXT)
  TO service_role;

-- ── 2. get_leaderboard ──────────────────────────────────────────────────────
--
-- Before (prod):
--   alltime  : Planning 7.011 ms / Execution 1.880 ms  (buffers hit 75)
--   monthly  : Planning 2.193 ms / Execution 7.105 ms  (buffers hit 70)
--              -> Seq Scan on profiles  Filter: (is_public AND deleted_at IS
--                 NULL AND username <> '')  Rows Removed by Filter: 4
--
-- The body is ALREADY set-based — two single-statement RETURN QUERYs, one per
-- timeframe shape — and it is left byte-identical on purpose. Standings are a
-- prize surface (seasonal rewards), and the branches are deliberately
-- asymmetric: alltime ranks on the running user_xp.total_xp column, while
-- weekly/monthly sums xp_transactions in-window and computes a fallback level.
-- Folding them into one statement would make the planner guess which side of
-- the timeframe test is live, and any drift in either would move real ranks.
-- The 7 ms planning cost of the two-branch plpgsql is not worth that risk.
--
-- What IS wrong is that the profiles-side predicate has no index, so every
-- call seq-scans profiles — 361 rows today, linear forever.
CREATE INDEX IF NOT EXISTS idx_profiles_public_ranked
  ON public.profiles (id)
  WHERE is_public AND deleted_at IS NULL AND username IS NOT NULL AND username <> '';

-- The windowed branch filters xp_transactions by created_at and groups by
-- user_id; (user_id, created_at) serves both in one index.
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_created
  ON public.xp_transactions (user_id, created_at DESC);

-- PARALLEL SAFE (reads of ordinary tables only) is the one function-level
-- change: both branches aggregate, and today neither may be parallelised.
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_timeframe TEXT DEFAULT 'alltime', p_limit INT DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  total_xp BIGINT,
  level INT,
  rank BIGINT
)
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_timeframe = 'alltime' THEN
    RETURN QUERY
      SELECT
        ux.user_id,
        p.username,
        p.avatar_url,
        ux.total_xp::BIGINT,
        ux.level,
        ROW_NUMBER() OVER (ORDER BY ux.total_xp DESC)::BIGINT AS rank
      FROM public.user_xp ux
      JOIN public.profiles p ON p.id = ux.user_id
      WHERE ux.total_xp > 0
        AND p.is_public = true
        AND p.deleted_at IS NULL
        AND p.username IS NOT NULL
        AND p.username <> ''
      ORDER BY ux.total_xp DESC
      LIMIT LEAST(p_limit, 100);
  ELSE
    RETURN QUERY
      SELECT
        sub.user_id,
        sub.username,
        sub.avatar_url,
        sub.total_xp,
        COALESCE(ux.level, FLOOR(SQRT(sub.total_xp / 100.0))::INT) AS level,
        ROW_NUMBER() OVER (ORDER BY sub.total_xp DESC)::BIGINT AS rank
      FROM (
        SELECT
          xt.user_id,
          p.username,
          p.avatar_url,
          SUM(xt.amount)::BIGINT AS total_xp
        FROM public.xp_transactions xt
        JOIN public.profiles p ON p.id = xt.user_id
        WHERE p.is_public = true
          AND p.deleted_at IS NULL
          AND p.username IS NOT NULL
          AND p.username <> ''
          AND xt.created_at >= CASE
            WHEN p_timeframe = 'weekly'  THEN NOW() - INTERVAL '7 days'
            WHEN p_timeframe = 'monthly' THEN NOW() - INTERVAL '1 month'
          END
        GROUP BY xt.user_id, p.username, p.avatar_url
      ) sub
      LEFT JOIN public.user_xp ux ON ux.user_id = sub.user_id
      ORDER BY sub.total_xp DESC
      LIMIT LEAST(p_limit, 100);
  END IF;
END;
$$;

-- Grants UNCHANGED: the leaderboard is a public surface. CREATE OR REPLACE
-- preserves existing grants; restated so a fresh database matches prod.
GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, INT) TO authenticated, anon;

-- ── 3. get_platform_stats ───────────────────────────────────────────────────
--
-- Before (prod): Execution 0.952 ms, Planning 2.394 ms. Fine per call — but
-- 48,830 calls/month for 361 users, i.e. once per landing render, because the
-- landing's `export const revalidate = 300` never takes effect on a route that
-- renders dynamically. The fix for the call count is server-side caching in
-- the app (unstable_cache, tag "platform-stats"); here we only note that
-- InitPlan 2 (COUNT(*) on profiles) was borrowing uq_profiles_referral_code
-- with 116 heap fetches. Nothing to change in SQL beyond the parallel marking.
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE (total_xp BIGINT, builders BIGINT, credentials BIGINT)
LANGUAGE sql
STABLE
PARALLEL SAFE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    (SELECT COALESCE(SUM(pux.total_xp), 0)::BIGINT FROM public.public_user_xp pux),
    (SELECT COUNT(*)::BIGINT FROM public.profiles),
    (SELECT COUNT(*)::BIGINT FROM public.certificates);
$$;

REVOKE EXECUTE ON FUNCTION public.get_platform_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO service_role;

-- ── 4. siws_nonces ──────────────────────────────────────────────────────────
--
-- Three statements run on every GET /api/auth/nonce: a rate-limit COUNT on
-- (status, ip_address, created_at) and two cleanup DELETEs on (status,
-- created_at). The only usable index is idx_siws_nonces_status — one of two
-- values, so it selects roughly half the table and then filters. There is no
-- expires_at column (expiry is `created_at < now() - ttl`), so the index has to
-- lead with status and carry created_at.
--
-- Today the table holds 1 row and every statement is ~0.1 ms; at login-storm
-- size the DELETEs are what take a ROW EXCLUSIVE lock, and a half-table scan
-- under that lock is how a cleanup convoy starts.
CREATE INDEX IF NOT EXISTS idx_siws_nonces_status_created_at
  ON public.siws_nonces (status, created_at);

CREATE INDEX IF NOT EXISTS idx_siws_nonces_status_ip_created_at
  ON public.siws_nonces (status, ip_address, created_at);

-- idx_siws_nonces_status is now a strict prefix of both indexes above and can
-- never be the better choice; drop it rather than pay for it on every INSERT.
DROP INDEX IF EXISTS public.idx_siws_nonces_status;

-- Keep planner statistics honest for the new partial/composite indexes.
ANALYZE public.user_progress;
ANALYZE public.profiles;
ANALYZE public.xp_transactions;
ANALYZE public.siws_nonces;
