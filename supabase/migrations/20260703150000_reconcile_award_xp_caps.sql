-- Reconcile award_xp XP caps into the migration chain (readiness audit).
--
-- The 2000/award + 5000/day caps live in schema.sql (and the current prod DB)
-- but were never captured as a migration, so a fresh DB built from the chain
-- would ship award_xp WITHOUT the caps — silently reopening the XP-integrity
-- ceiling (G1). This redefines award_xp verbatim from schema.sql so the repo
-- migration chain reproduces prod. CREATE OR REPLACE keeps existing GRANTs.

CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT DEFAULT NULL,
  p_tx_signature TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
  v_new_longest INTEGER;
  v_daily_total INTEGER;
  -- Hard per-award ceiling. Matches the documented "max 2000 XP per award"
  -- (the largest legitimate single award is a course-completion bonus).
  c_max_award_xp CONSTANT INTEGER := 2000;
  -- Per-user daily ceiling across the learning XP path (lessons, challenges,
  -- bonuses, achievements). Generous enough for normal multi-course days,
  -- low enough to cap a forged-"passed" farming loop.
  c_max_daily_award_xp CONSTANT INTEGER := 5000;
BEGIN
  -- Reject non-positive awards outright (defensive — callers pass positives).
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN;
  END IF;

  -- Clamp any single award to the hard ceiling.
  IF p_amount > c_max_award_xp THEN
    p_amount := c_max_award_xp;
  END IF;

  -- Serialize concurrent awards for the same user so the read-then-insert daily
  -- cap below is atomic: without this lock, two parallel awards can both read a
  -- sub-cap total and both insert, blowing past the daily ceiling.
  PERFORM pg_advisory_xact_lock(hashtext('award_xp:' || p_user_id::text)::bigint);

  -- Enforce the per-user daily ceiling. Sum today's learning-path awards
  -- (excluding community XP, which is capped separately) and clamp the credit
  -- so the daily total can never exceed the ceiling. The window boundary is
  -- pinned to UTC midnight so it is independent of the DB session timezone.
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.xp_transactions
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
    AND reason NOT LIKE 'community:%';

  IF v_daily_total >= c_max_daily_award_xp THEN
    RETURN;
  END IF;

  IF v_daily_total + p_amount > c_max_daily_award_xp THEN
    p_amount := c_max_daily_award_xp - v_daily_total;
  END IF;

  IF p_amount <= 0 THEN
    RETURN;
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.xp_transactions (user_id, amount, reason, idempotency_key, tx_signature)
    VALUES (p_user_id, p_amount, p_reason, p_idempotency_key, p_tx_signature)
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    -- If nothing was inserted (duplicate), skip the XP update too
    IF NOT FOUND THEN
      RETURN;
    END IF;
  ELSE
    INSERT INTO public.xp_transactions (user_id, amount, reason, tx_signature)
    VALUES (p_user_id, p_amount, p_reason, p_tx_signature);
  END IF;

  -- Get current streak state before updating
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.user_xp
  WHERE user_id = p_user_id;

  -- Calculate new streak
  IF v_last_activity IS NULL THEN
    -- First activity ever
    v_new_streak := 1;
  ELSIF v_last_activity = CURRENT_DATE THEN
    -- Already active today, keep current streak
    v_new_streak := COALESCE(v_current_streak, 1);
  ELSIF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Active yesterday, increment streak
    v_new_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    -- Gap > 1 day, reset streak
    v_new_streak := 1;
  END IF;

  v_new_longest := GREATEST(COALESCE(v_longest_streak, 0), v_new_streak);

  INSERT INTO public.user_xp (user_id, total_xp, level, last_activity_date, current_streak, longest_streak)
  VALUES (
    p_user_id,
    p_amount,
    floor(sqrt(p_amount / 100.0))::int,
    CURRENT_DATE,
    v_new_streak,
    v_new_longest
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_xp.total_xp + p_amount,
    level = floor(sqrt((user_xp.total_xp + p_amount) / 100.0))::int,
    last_activity_date = CURRENT_DATE,
    current_streak = v_new_streak,
    longest_streak = v_new_longest;
END;
$$;
