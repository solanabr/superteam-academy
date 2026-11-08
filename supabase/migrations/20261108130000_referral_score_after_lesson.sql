-- ============================================================================
-- Migration: referral_score_after_lesson — from Season 2, a referral scores once
-- the referred learner has completed a lesson
--
-- claim_referral still records the referral (referred_by + the 'signup' row in
-- referral_events) under its existing rules. What changes is how points are
-- read: a referral_events row created from Season 2 on scores for its referrer
-- only when the referred account has at least one dated completed lesson in
-- user_progress. A row created inside Season 1 scores as before this
-- migration, at its created_at, lesson or not. A referred
-- account deleted later keeps its rows (lib/account/deletion-policy.ts), so a
-- point it already earned stays. Every points read goes through
-- referral_scored_events below, so the public board and the referrer's own
-- totals give the same numbers.
--
-- WHICH EVENTS ARE SEASON 1
--   Read from the referral_seasons row with number = 1: an event whose
--   created_at falls in that row's [starts_at, ends_at) window. No date is
--   written here. Without a Season 1 row, every event needs a lesson.
--
-- WHEN A POINT LANDS
--   Season 1 events: scored_at = created_at, as before. Later events:
--   scored_at = GREATEST(created_at, the referred learner's first dated
--   completed lesson). Season windows test scored_at, so a referral claimed
--   between seasons, or near the end of one, scores in the season its first
--   lesson lands, and a closed season's standings don't change afterwards.
--
-- WHY A READ-TIME JOIN AND NOT A STORED STATUS
--   The rule is computed from user_progress when points are read, so there is
--   no new column to backfill and nothing added to the lesson-completion write
--   path. The per-learner lookup is served by idx_user_progress_user_completed_at
--   (user_id, completed_at DESC), from 20260731170000_reengagement_pipeline.
--
-- WHAT THIS ADDS / REPLACES
--   referral_scored_events(UUID)              new, service_role
--   get_own_referral_totals(UUID, TZ, TZ)     new, service_role
--   get_referral_leaderboard(INT, INT)        replaced; body carried forward from
--     20260820140000_tombstone_public_surfaces (referrer is_public, deleted_at
--     and username filters kept), now counting referral_scored_events rows and
--     breaking ties on the earliest scored_at. Grant re-stated unchanged.
--
-- Idempotent: CREATE OR REPLACE throughout, no data change. Not wrapped in
-- BEGIN/COMMIT: the Supabase CLI and MCP apply_migration wrap the file already.
-- ============================================================================

-- ── 1. referral_scored_events ───────────────────────────────────────────────
-- One row per referral_events row that scores. p_referrer_id NULL = every
-- referrer. season_one matches events created inside Season 1's window. The
-- LATERAL picks the referred learner's earliest completed lesson that has a
-- completed_at. An event scores when it is a Season 1 event or that lesson
-- exists.
CREATE OR REPLACE FUNCTION public.referral_scored_events(p_referrer_id UUID DEFAULT NULL)
RETURNS TABLE (
  referrer_id UUID,
  referred_id UUID,
  kind TEXT,
  scored_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    re.referrer_id,
    re.referred_id,
    re.kind,
    CASE
      WHEN season_one.number IS NOT NULL THEN re.created_at
      ELSE GREATEST(re.created_at, first_lesson.completed_at)
    END AS scored_at
  FROM public.referral_events re
  LEFT JOIN public.referral_seasons season_one
    ON season_one.number = 1
   AND re.created_at >= season_one.starts_at
   AND re.created_at < season_one.ends_at
  LEFT JOIN LATERAL (
    SELECT up.completed_at
    FROM public.user_progress up
    WHERE up.user_id = re.referred_id
      AND up.completed = true
      AND up.completed_at IS NOT NULL
    ORDER BY up.completed_at ASC
    LIMIT 1
  ) first_lesson ON true
  WHERE (p_referrer_id IS NULL OR re.referrer_id = p_referrer_id)
    AND (season_one.number IS NOT NULL OR first_lesson.completed_at IS NOT NULL);
$$;

REVOKE EXECUTE ON FUNCTION public.referral_scored_events(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.referral_scored_events(UUID) TO service_role;

-- ── 2. get_own_referral_totals ──────────────────────────────────────────────
-- The signed-in referrer's numbers for /api/referrals/me: points scored inside
-- the given season window, and the lifetime count of referred signups that
-- score. The caller resolves the season window; a NULL window (no season yet)
-- gives 0 season points.
CREATE OR REPLACE FUNCTION public.get_own_referral_totals(
  p_user_id UUID,
  p_season_starts_at TIMESTAMPTZ,
  p_season_ends_at TIMESTAMPTZ
)
RETURNS TABLE (
  season_points BIGINT,
  referred_signups BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COUNT(*) FILTER (
      WHERE s.scored_at >= p_season_starts_at
        AND s.scored_at < p_season_ends_at
    )::BIGINT AS season_points,
    COUNT(*) FILTER (WHERE s.kind = 'signup')::BIGINT AS referred_signups
  FROM public.referral_scored_events(p_user_id) s;
$$;

REVOKE EXECUTE ON FUNCTION public.get_own_referral_totals(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_referral_totals(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- ── 3. get_referral_leaderboard ─────────────────────────────────────────────
-- Season resolution unchanged. Unchanged: LANGUAGE plpgsql, STABLE, SECURITY
-- DEFINER, `SET search_path = ''`, and the anon + authenticated EXECUTE grant.
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(
  p_season INT DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  points BIGINT,
  rank BIGINT,
  season_number INT,
  season_starts_at TIMESTAMPTZ,
  season_ends_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_season public.referral_seasons%ROWTYPE;
BEGIN
  IF p_season IS NOT NULL THEN
    SELECT * INTO v_season FROM public.referral_seasons rs WHERE rs.number = p_season;
  ELSE
    SELECT * INTO v_season FROM public.referral_seasons rs
    WHERE NOW() >= rs.starts_at AND NOW() < rs.ends_at
    ORDER BY rs.number DESC LIMIT 1;
    IF NOT FOUND THEN
      SELECT * INTO v_season FROM public.referral_seasons rs
      ORDER BY rs.number DESC LIMIT 1;
    END IF;
  END IF;
  IF v_season.number IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      s.referrer_id AS user_id,
      p.username,
      p.avatar_url,
      COUNT(*)::BIGINT AS points,
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC, MIN(s.scored_at) ASC)::BIGINT AS rank,
      v_season.number AS season_number,
      v_season.starts_at AS season_starts_at,
      v_season.ends_at AS season_ends_at
    FROM public.referral_scored_events() s
    JOIN public.profiles p ON p.id = s.referrer_id
    WHERE s.scored_at >= v_season.starts_at
      AND s.scored_at < v_season.ends_at
      AND p.is_public = true
      AND p.deleted_at IS NULL
      AND p.username IS NOT NULL
      AND p.username <> ''
    GROUP BY s.referrer_id, p.username, p.avatar_url
    ORDER BY COUNT(*) DESC, MIN(s.scored_at) ASC
    LIMIT LEAST(p_limit, 100);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(INT, INT) TO authenticated, anon;
