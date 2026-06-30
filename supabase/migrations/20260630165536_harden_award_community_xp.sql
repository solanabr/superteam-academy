-- Migration: harden_award_community_xp
-- Fixes two defects in award_community_xp() that were already fixed in
-- award_xp() by PR #179. Refs: #182 (this fix), #179 (the reference fix).
--
-- Fix 1 — Non-atomic daily cap:
--   The previous implementation did SELECT SUM(...) INTO v_daily_total; INSERT
--   with no per-user lock. Concurrent community awards could both read a
--   sub-cap total and both insert, exceeding the 50/day (and 10/day-vote)
--   ceiling. Added pg_advisory_xact_lock() to serialize concurrent calls for
--   the same user, making the read-then-insert atomic.
--   Uses a distinct key namespace ('award_community_xp:') so it does not
--   contend with award_xp's lock ('award_xp:') — the two functions count
--   disjoint xp_transactions rows (community:% vs NOT community:%).
--
-- Fix 2 — Session-TZ rollover:
--   The daily window used (CURRENT_DATE)::timestamptz, which depends on the
--   DB session timezone. Replaced with:
--     date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
--   to pin the boundary to UTC midnight regardless of session timezone.
--   Both occurrences patched (v_daily_total query and v_daily_vote_total query).
--
-- Scope: ONLY the cap window + atomicity. Streak logic (last_activity_date =
-- CURRENT_DATE) and user_xp upsert are intentionally left unchanged, matching
-- award_xp() which also keeps CURRENT_DATE for streak day.
--
-- This is idempotent (CREATE OR REPLACE FUNCTION). Safe to re-run.

CREATE OR REPLACE FUNCTION award_community_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_daily_total INTEGER;
  v_daily_vote_total INTEGER;
  v_is_vote_xp BOOLEAN;
BEGIN
  IF p_amount <= 0 THEN RETURN FALSE; END IF;

  -- Serialize concurrent community awards for the same user so the read-then-
  -- insert daily cap below is atomic (mirrors the lock added to award_xp in
  -- #179). A distinct key namespace avoids contending with award_xp's lock —
  -- the two functions count disjoint xp_transactions rows (community:% vs NOT
  -- community:%), so they need not serialize against each other.
  PERFORM pg_advisory_xact_lock(hashtext('award_community_xp:' || p_user_id::text)::bigint);

  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.xp_transactions
  WHERE user_id = p_user_id
    AND reason LIKE 'community:%'
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

  IF v_daily_total >= 50 THEN RETURN FALSE; END IF;

  v_is_vote_xp := p_reason LIKE 'community:upvote%';
  IF v_is_vote_xp THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_daily_vote_total
    FROM public.xp_transactions
    WHERE user_id = p_user_id
      AND reason LIKE 'community:upvote%'
      AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

    IF v_daily_vote_total >= 10 THEN RETURN FALSE; END IF;

    IF v_daily_vote_total + p_amount > 10 THEN
      p_amount := 10 - v_daily_vote_total;
    END IF;
    IF p_amount <= 0 THEN RETURN FALSE; END IF;
  END IF;

  IF v_daily_total + p_amount > 50 THEN
    p_amount := 50 - v_daily_total;
  END IF;
  IF p_amount <= 0 THEN RETURN FALSE; END IF;

  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.xp_transactions (user_id, amount, reason, idempotency_key)
    VALUES (p_user_id, p_amount, p_reason, p_idempotency_key)
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL
    DO NOTHING;

    IF NOT FOUND THEN RETURN FALSE; END IF;
  ELSE
    INSERT INTO public.xp_transactions (user_id, amount, reason)
    VALUES (p_user_id, p_amount, p_reason);
  END IF;

  INSERT INTO public.user_xp (id, user_id, total_xp, level, current_streak, longest_streak, last_activity_date)
  VALUES (
    gen_random_uuid(), p_user_id, p_amount,
    floor(sqrt(p_amount / 100.0))::int,
    1, 1, CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_xp.total_xp + p_amount,
    level = floor(sqrt((user_xp.total_xp + p_amount) / 100.0))::int,
    last_activity_date = CURRENT_DATE,
    current_streak = CASE
      WHEN user_xp.last_activity_date IS NULL THEN 1
      WHEN user_xp.last_activity_date = CURRENT_DATE THEN user_xp.current_streak
      WHEN user_xp.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_xp.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_xp.longest_streak,
      CASE
        WHEN user_xp.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_xp.current_streak + 1
        WHEN user_xp.last_activity_date = CURRENT_DATE THEN user_xp.current_streak
        ELSE 1
      END
    );

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION award_community_xp(UUID, INTEGER, TEXT, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION award_community_xp(UUID, INTEGER, TEXT, TEXT) TO service_role;
