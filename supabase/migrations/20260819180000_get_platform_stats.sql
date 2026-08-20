-- Landing-page platform stats in one call (#1091): the landing was selecting
-- total_xp for EVERY row of public_user_xp and summing in JS (grows per user,
-- runs per visitor) plus two head-count queries. This function computes the
-- same three numbers with SQL aggregates over the exact same sources:
--   total_xp    = SUM(total_xp) over public_user_xp (is_public-filtered view)
--   builders    = COUNT(*) over profiles (unfiltered — matches the old head count)
--   credentials = COUNT(*) over certificates (unfiltered — matches the old head count)
-- SECURITY DEFINER + service_role-only, mirroring get_leaderboard's pattern:
-- the base tables are own-row-only under RLS, and this is called exclusively
-- from the server-rendered landing via createAdminClient().

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE (total_xp BIGINT, builders BIGINT, credentials BIGINT)
LANGUAGE sql
STABLE
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
