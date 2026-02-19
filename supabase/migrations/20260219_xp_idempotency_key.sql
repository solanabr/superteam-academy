-- Add idempotency_key to xp_transactions for race-safe retry deduplication.
-- Normal award_xp calls pass NULL (no conflict possible).
-- Retry path passes the lessonId/referenceId to prevent double-award on concurrent logins.

ALTER TABLE xp_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_transactions_idempotency
  ON xp_transactions (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Update award_xp to accept an optional idempotency key.
-- When provided, the INSERT uses ON CONFLICT DO NOTHING for deduplication.
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
  v_new_longest INTEGER;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO xp_transactions (user_id, amount, reason, idempotency_key)
    VALUES (p_user_id, p_amount, p_reason, p_idempotency_key)
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    -- If nothing was inserted (duplicate), skip the XP update too
    IF NOT FOUND THEN
      RETURN;
    END IF;
  ELSE
    INSERT INTO xp_transactions (user_id, amount, reason)
    VALUES (p_user_id, p_amount, p_reason);
  END IF;

  -- Get current streak state before updating
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM user_xp
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

  INSERT INTO user_xp (user_id, total_xp, level, last_activity_date, current_streak, longest_streak)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
