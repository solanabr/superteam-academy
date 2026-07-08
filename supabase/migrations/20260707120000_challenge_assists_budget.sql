-- Migration: challenge_assists_budget
-- The AI Partner challenge page meters PAID AI assists per (user, lesson).
-- The paid cap is the cost ceiling, so the spend RPC is atomic (one
-- INSERT..ON CONFLICT) and the TS wrapper (apps/web/src/lib/ai/assist-budget.ts)
-- treats any error as "deny" — fail CLOSED, the opposite of check_rate_limit.
-- All three RPCs are SECURITY DEFINER, search_path-pinned, and reachable only by
-- service_role (the table has RLS on and no policies), mirroring award_xp etc.
--
-- Mirrors supabase/schema.sql (kept as the full-schema snapshot). Idempotent
-- (IF NOT EXISTS / CREATE OR REPLACE) so it is safe to re-apply.

CREATE TABLE IF NOT EXISTS challenge_assists (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id   TEXT NOT NULL,
  assists_used INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE challenge_assists ENABLE ROW LEVEL SECURITY;
-- No policies: reached only through SECURITY DEFINER RPCs called by service_role.

-- Atomically spend one paid assist if under the cap. Returns whether allowed
-- and the resulting count. Callers pass p_max_paid (4).
CREATE OR REPLACE FUNCTION spend_challenge_assist(
  p_user_id   UUID,
  p_lesson_id TEXT,
  p_max_paid  INT
) RETURNS TABLE (allowed BOOLEAN, used INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_used INT;
BEGIN
  INSERT INTO public.challenge_assists (user_id, lesson_id, assists_used, updated_at)
  VALUES (p_user_id, p_lesson_id, 1, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    assists_used = public.challenge_assists.assists_used + 1,
    updated_at = now()
  RETURNING public.challenge_assists.assists_used INTO v_used;

  IF v_used > p_max_paid THEN
    -- Over the cap: clamp the stored count back to p_max_paid so repeated
    -- denied calls can't let it run away, and deny.
    UPDATE public.challenge_assists
      SET assists_used = p_max_paid
      WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
    RETURN QUERY SELECT false, p_max_paid;
  ELSE
    RETURN QUERY SELECT true, v_used;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION spend_challenge_assist(UUID, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION spend_challenge_assist(UUID, TEXT, INT) TO service_role;

CREATE OR REPLACE FUNCTION get_challenge_assists(p_user_id UUID, p_lesson_id TEXT)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT assists_used FROM public.challenge_assists
      WHERE user_id = p_user_id AND lesson_id = p_lesson_id), 0);
$$;

REVOKE ALL ON FUNCTION get_challenge_assists(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_challenge_assists(UUID, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION reset_challenge_assists(p_user_id UUID, p_lesson_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM public.challenge_assists
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
$$;

REVOKE ALL ON FUNCTION reset_challenge_assists(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_challenge_assists(UUID, TEXT) TO service_role;

-- Decrement-by-one, floor 0. Refunds a single paid assist that was spent but
-- never delivered (e.g. the Gemini call failed after spend_challenge_assist
-- already charged it) — NOT reset_challenge_assists, which zeroes the whole
-- lesson and would over-refund every other legitimately-spent assist.
CREATE OR REPLACE FUNCTION refund_challenge_assist(p_user_id UUID, p_lesson_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.challenge_assists
    SET assists_used = GREATEST(assists_used - 1, 0), updated_at = now()
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
$$;

REVOKE ALL ON FUNCTION refund_challenge_assist(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION refund_challenge_assist(UUID, TEXT) TO service_role;
