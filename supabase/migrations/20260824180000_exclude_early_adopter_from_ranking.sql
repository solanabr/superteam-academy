-- Exclude the early-adopter grant from every ranking surface (owner decision
-- 2026-08-24, narrow-exclusion option). The badge paid 1000 XP to 11 users —
-- more than the whole catalog's learning XP (920) — so the all-time board
-- ranked signup order. The XP itself is soulbound and stays: holders keep
-- their balance and level; the grant just stops scoring. Mirrors the #736
-- creator-reward pattern (source stays 'achievement', so the exclusion is by
-- reason, not source).

CREATE OR REPLACE FUNCTION public.is_rank_excluded_reason(p_reason TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_reason = 'Achievement reward: achievement-early-adopter';
$$;

REVOKE EXECUTE ON FUNCTION public.is_rank_excluded_reason(TEXT)
  FROM PUBLIC, anon, authenticated;

-- get_leaderboard: the alltime branch moves from user_xp.total_xp (a running
-- column a single grant cannot be carved out of) to summing xp_transactions,
-- as the weekly/monthly branch already does. Level display still comes from
-- user_xp, so nobody loses a level.
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
        AND NOT public.is_rank_excluded_reason(xt.reason)
        AND (
          p_timeframe = 'alltime'
          OR xt.created_at >= CASE
            WHEN p_timeframe = 'weekly'  THEN NOW() - INTERVAL '7 days'
            WHEN p_timeframe = 'monthly' THEN NOW() - INTERVAL '1 month'
          END
        )
      GROUP BY xt.user_id, p.username, p.avatar_url
      HAVING SUM(xt.amount) > 0
    ) sub
    LEFT JOIN public.user_xp ux ON ux.user_id = sub.user_id
    ORDER BY sub.total_xp DESC
    LIMIT LEAST(p_limit, 100);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, INT) TO authenticated, anon;

-- Cohort leagues: same exclusion on both scoring reads (tier placement and
-- weekly score refresh). Bodies otherwise verbatim from the current schema.
CREATE OR REPLACE FUNCTION public.ensure_league_membership(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  LEAGUE_COHORT_CAPACITY CONSTANT INTEGER := 30;
  v_week_start      DATE;
  v_prior_start     DATE;
  v_prior_xp        BIGINT;
  v_tier            SMALLINT;
  v_cohort_id       UUID;
  v_inserted_cohort UUID;
BEGIN
  v_week_start  := public.league_week_start(CURRENT_DATE);

  SELECT cohort_id INTO v_cohort_id
  FROM public.league_members
  WHERE user_id = p_user_id AND week_start = v_week_start;
  IF FOUND THEN
    RETURN v_cohort_id;
  END IF;

  v_prior_start := v_week_start - 7;
  SELECT COALESCE(SUM(x.amount), 0) INTO v_prior_xp
  FROM public.xp_transactions x
  WHERE x.user_id = p_user_id
    AND x.created_at >= v_prior_start::timestamptz
    AND x.created_at <  v_week_start::timestamptz
    AND public.is_league_eligible_source(x.source)
      AND NOT public.is_rank_excluded_reason(x.reason);

  SELECT t.tier INTO v_tier
  FROM public.league_tiers t
  WHERE t.min_prior_week_xp <= v_prior_xp
  ORDER BY t.min_prior_week_xp DESC
  LIMIT 1;
  IF v_tier IS NULL THEN
    SELECT MIN(t.tier) INTO v_tier FROM public.league_tiers t;
  END IF;

  SELECT c.id INTO v_cohort_id
  FROM public.league_cohorts c
  WHERE c.week_start = v_week_start
    AND c.tier = v_tier
    AND c.member_count < LEAGUE_COHORT_CAPACITY
  ORDER BY c.created_at DESC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_cohort_id IS NULL THEN
    INSERT INTO public.league_cohorts (week_start, tier, member_count)
    VALUES (v_week_start, v_tier, 0)
    RETURNING id INTO v_cohort_id;
  END IF;

  INSERT INTO public.league_members (cohort_id, user_id, week_start, score)
  VALUES (v_cohort_id, p_user_id, v_week_start, 0)
  ON CONFLICT (user_id, week_start) DO NOTHING
  RETURNING cohort_id INTO v_inserted_cohort;

  IF v_inserted_cohort IS NOT NULL THEN
    UPDATE public.league_cohorts
    SET member_count = member_count + 1
    WHERE id = v_cohort_id;
    RETURN v_cohort_id;
  END IF;

  SELECT cohort_id INTO v_cohort_id
  FROM public.league_members
  WHERE user_id = p_user_id AND week_start = v_week_start;
  RETURN v_cohort_id;
END;
$$;
CREATE OR REPLACE FUNCTION public.refresh_cohort_scores(p_cohort_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  LEAGUE_REFRESH_THROTTLE CONSTANT INTERVAL := INTERVAL '1 minute';
  v_week_start DATE;
  v_refreshed  TIMESTAMPTZ;
BEGIN
  SELECT week_start, scores_refreshed_at INTO v_week_start, v_refreshed
  FROM public.league_cohorts
  WHERE id = p_cohort_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_refreshed IS NOT NULL
     AND v_refreshed > now() - LEAGUE_REFRESH_THROTTLE THEN
    RETURN;
  END IF;

  UPDATE public.league_members m
  SET score = COALESCE((
    SELECT SUM(x.amount)
    FROM public.xp_transactions x
    WHERE x.user_id = m.user_id
      AND x.created_at >= v_week_start::timestamptz
      AND x.created_at <  (v_week_start + 7)::timestamptz
      AND public.is_league_eligible_source(x.source)
      AND NOT public.is_rank_excluded_reason(x.reason)
  ), 0)
  WHERE m.cohort_id = p_cohort_id;

  UPDATE public.league_cohorts
  SET scores_refreshed_at = now()
  WHERE id = p_cohort_id;
END;
$$;
