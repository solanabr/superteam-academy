-- ============================================================================
-- Migration: award_xp reports the credited amount (RETURNS INTEGER)
-- Task: CS-7 (#353) adversarial follow-up — finding B2
-- ----------------------------------------------------------------------------
-- ⚠️  MERGE-ORDER REQUIREMENT — same as 20260709120000: apply to prod BEFORE
--     (or atomically with) the code deploy. The new queue processor reads the
--     RPC's return value to decide whether a quest_xp delivery row is resolved;
--     against the old void function it reads null → treats every credit as
--     cap-deferred → rows are retried on every sweep (safe — idempotent — but
--     noisy and never resolved). Apply first.
--
-- Why: award_xp silently drops (or clamps to 0) a credit once the 5000/day cap
-- is reached, returning void with no error. The pending_onchain_actions queue
-- marked rows resolved_at on "no error", so a cap-eaten quest_xp credit was
-- recorded as delivered — silent XP loss, the exact bug class the durable
-- queue exists to eliminate. Fix: award_xp now RETURNS INTEGER = the amount
-- actually credited:
--   > 0 → XP landed (for an idempotency-key duplicate, the previously-credited
--         amount is returned — "already delivered" reads as delivered).
--   = 0 → nothing was credited (invalid amount or daily cap consumed the whole
--         award). Callers must NOT mark delivery resolved on 0.
--
-- Postgres cannot ALTER a function's return type, so this is DROP + CREATE.
-- DROP FUNCTION discards the existing REVOKE/GRANT set, so the service_role-
-- only lockdown (F-06) is re-applied explicitly below — do not remove it.
--
-- Existing callers are unaffected: every app call site invokes award_xp via
-- supabase.rpc() and only inspects `error`; PL/pgSQL callers use PERFORM/none.
--
-- Idempotent: DROP ... IF EXISTS + CREATE. Safe to re-run.
--
-- ── ROLLBACK (restores the pre-migration void signature) ────────────────────
-- Re-run supabase/migrations/20260703150000_reconcile_award_xp_caps.sql
-- prefixed with:
--   DROP FUNCTION IF EXISTS public.award_xp(UUID, INTEGER, TEXT, TEXT, TEXT);
-- then re-apply the REVOKE/GRANT block at the bottom of this file.
-- (Roll back the code deploy first — the new queue processor expects the
-- INTEGER return.)
-- ============================================================================

DROP FUNCTION IF EXISTS public.award_xp(UUID, INTEGER, TEXT, TEXT, TEXT);

CREATE FUNCTION public.award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT DEFAULT NULL,
  p_tx_signature TEXT DEFAULT NULL
) RETURNS INTEGER
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
  v_prev_amount INTEGER;
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
    RETURN 0;
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
    RETURN 0;
  END IF;

  IF v_daily_total + p_amount > c_max_daily_award_xp THEN
    p_amount := c_max_daily_award_xp - v_daily_total;
  END IF;

  IF p_amount <= 0 THEN
    RETURN 0;
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.xp_transactions (user_id, amount, reason, idempotency_key, tx_signature)
    VALUES (p_user_id, p_amount, p_reason, p_idempotency_key, p_tx_signature)
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    -- If nothing was inserted (duplicate), skip the XP update too. Report the
    -- previously-credited amount (always > 0 — award_xp never records a
    -- non-positive transaction) so callers see "already delivered", not
    -- "dropped".
    IF NOT FOUND THEN
      SELECT amount INTO v_prev_amount
      FROM public.xp_transactions
      WHERE user_id = p_user_id
        AND idempotency_key = p_idempotency_key;
      RETURN COALESCE(v_prev_amount, 0);
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

  RETURN p_amount;
END;
$$;

-- Re-apply the service_role-only lockdown (F-06) — DROP FUNCTION discarded the
-- previous grants, and CREATE FUNCTION defaults to EXECUTE for PUBLIC.
REVOKE EXECUTE ON FUNCTION public.award_xp(UUID, INTEGER, TEXT, TEXT, TEXT)
  FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.award_xp(UUID, INTEGER, TEXT, TEXT, TEXT)
  TO service_role;
