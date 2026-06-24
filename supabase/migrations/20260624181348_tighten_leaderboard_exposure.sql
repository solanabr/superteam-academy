-- ============================================
-- Tighten leaderboard / XP data exposure (P1-6)
-- ============================================
-- The broad "USING (true)" SELECT policies on user_xp and xp_transactions let
-- anon/authenticated read every user's raw XP ledger (amount, reason,
-- tx_signature, created_at) and full user_xp rows (incl. streak fields). Lock
-- both down while keeping the public features that need aggregate XP working:
--
--   * get_leaderboard() -> SECURITY DEFINER, so the public leaderboard keeps
--     working off non-sensitive columns without the broad table policies.
--   * public_user_xp: a new non-sensitive view exposing only
--     (user_id, total_xp, level) for is_public profiles, for public reads
--     (marketing stats, public profiles, community author level badges).
--   * community_stats: owner-privilege view with an explicit (is_public OR own)
--     guard, so its community-XP aggregate keeps working without re-exposing
--     xp_transactions — preserving P0-B1's guarantee that anon can't read
--     private-profile aggregates.
--
-- The own-row SELECT policies remain, so users still read their own rows.

-- 1. Leaderboard RPC: read all rows via definer rights; returns only
--    user_id / username / avatar_url / total_xp / level / rank.
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
        AND p.username IS NOT NULL
        AND p.username <> ''
      ORDER BY ux.total_xp DESC
      LIMIT p_limit;
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
        WHERE p.username IS NOT NULL
          AND p.username <> ''
          AND xt.created_at >= CASE
            WHEN p_timeframe = 'weekly'  THEN NOW() - INTERVAL '7 days'
            WHEN p_timeframe = 'monthly' THEN NOW() - INTERVAL '1 month'
          END
        GROUP BY xt.user_id, p.username, p.avatar_url
      ) sub
      LEFT JOIN public.user_xp ux ON ux.user_id = sub.user_id
      ORDER BY sub.total_xp DESC
      LIMIT p_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, INT) TO authenticated, anon;

-- 2. Drop the broad SELECT policies (own-row policies remain).
DROP POLICY IF EXISTS "Leaderboard: anyone can view XP rankings" ON user_xp;
DROP POLICY IF EXISTS "Anyone can view XP transactions for leaderboard" ON xp_transactions;

-- 3. Non-sensitive public view: per-user total_xp / level for public profiles.
CREATE OR REPLACE VIEW public_user_xp AS
  SELECT ux.user_id, ux.total_xp, ux.level
  FROM user_xp ux
  JOIN profiles p ON p.id = ux.user_id
  WHERE p.is_public = true;

REVOKE ALL ON public_user_xp FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public_user_xp TO anon, authenticated;

-- 4. community_stats: owner-privilege view + explicit privacy guard so the
--    community-XP aggregate works without xp_transactions being client-readable.
DROP VIEW IF EXISTS community_stats;
CREATE VIEW community_stats AS
SELECT
  p.id AS user_id,
  COUNT(DISTINCT t.id) AS total_threads,
  COUNT(DISTINCT a.id) AS total_answers,
  COUNT(DISTINCT a.id) FILTER (WHERE a.is_accepted) AS accepted_answers,
  COALESCE(SUM(xt.amount) FILTER (WHERE xt.reason LIKE 'community:%'), 0) AS total_community_xp
FROM profiles p
LEFT JOIN threads t ON t.author_id = p.id
LEFT JOIN answers a ON a.author_id = p.id
LEFT JOIN xp_transactions xt ON xt.user_id = p.id
WHERE p.is_public = true OR p.id = auth.uid()
GROUP BY p.id;

REVOKE ALL ON community_stats FROM PUBLIC, anon, authenticated;
GRANT SELECT ON community_stats TO anon, authenticated;
