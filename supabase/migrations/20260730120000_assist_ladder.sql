-- Migration: assist_ladder (#864 — AI assist ladder, epic #838 item 32)
--
-- Widens the per-(user, lesson) challenge_assists quota into the 3-tier ladder
-- from the AI-tutor-economics spec §4.2 (owner decision batch 2026-07-30):
--   free tier      2 turns  (hidden counter — full tutor, no meter shown)
--   metered tier   8 turns  (turns 3–10; meter visible)
--   Socratic tier  20 turns (turns 11–30; questions-first contract, propose alive)
--   turn 31        community handoff (deny; the client shows the forum link)
-- All catalog-bounded; no calendar refills of any kind (spec §4.3).
--
-- Also ships the guarded self-serve reset (P2-5, owner D-8 KEEP): the
-- once-per-(user, lesson) flag AND the 7-day cooldown are enforced INSIDE the
-- SECURITY DEFINER RPC in this same migration that the reset route calls (rule
-- R-6) — never as client-side checks. The cooldown is a rolling 7-day duration
-- from the lesson's last assist activity, not a calendar window (no timezone
-- semantics anywhere in this migration).
--
-- House pattern throughout: SECURITY DEFINER, SET search_path = '', RLS-on
-- table with no policies, REVOKE from PUBLIC/anon/authenticated, GRANT to
-- service_role only. Mirrors supabase/schema.sql. Idempotent — safe to
-- re-apply. The legacy single-meter RPCs (spend_challenge_assist,
-- get_challenge_assists, refund_challenge_assist) are left in place untouched;
-- the route now spends through spend_assist_ladder_turn.

-- 1. Ladder counters + reset bookkeeping. assists_used (existing) becomes the
--    METERED-tier counter; free/Socratic turns get their own columns so a
--    refund can hand back exactly the tier that was spent.
ALTER TABLE challenge_assists
  ADD COLUMN IF NOT EXISTS free_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE challenge_assists
  ADD COLUMN IF NOT EXISTS socratic_used INTEGER NOT NULL DEFAULT 0;
-- NULL = the one-time self-serve reset has never been used for this lesson.
ALTER TABLE challenge_assists
  ADD COLUMN IF NOT EXISTS reset_used_at TIMESTAMPTZ;

-- 2. Atomically spend one ladder turn. Resolves the tier server-side from the
--    stored counts (free → metered → Socratic, in order), increments exactly
--    one counter, and reports which tier the turn landed in — or denies with
--    tier 'exhausted' once all 30 turns are gone. Row-locked (FOR UPDATE) so
--    two concurrent requests cannot both land in the last slot of a tier.
CREATE OR REPLACE FUNCTION spend_assist_ladder_turn(
  p_user_id      UUID,
  p_lesson_id    TEXT,
  p_free_max     INT,
  p_metered_max  INT,
  p_socratic_max INT
) RETURNS TABLE (allowed BOOLEAN, tier TEXT, free_turns INT, metered_turns INT, socratic_turns INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v RECORD;
BEGIN
  INSERT INTO public.challenge_assists (user_id, lesson_id)
  VALUES (p_user_id, p_lesson_id)
  ON CONFLICT (user_id, lesson_id) DO NOTHING;

  SELECT ca.free_used, ca.assists_used, ca.socratic_used
    INTO v
    FROM public.challenge_assists ca
    WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id
    FOR UPDATE;

  IF v.free_used < p_free_max THEN
    UPDATE public.challenge_assists ca
      SET free_used = ca.free_used + 1, updated_at = now()
      WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id;
    RETURN QUERY SELECT true, 'free'::TEXT, v.free_used + 1, v.assists_used, v.socratic_used;
  ELSIF v.assists_used < p_metered_max THEN
    UPDATE public.challenge_assists ca
      SET assists_used = ca.assists_used + 1, updated_at = now()
      WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id;
    RETURN QUERY SELECT true, 'metered'::TEXT, v.free_used, v.assists_used + 1, v.socratic_used;
  ELSIF v.socratic_used < p_socratic_max THEN
    UPDATE public.challenge_assists ca
      SET socratic_used = ca.socratic_used + 1, updated_at = now()
      WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id;
    RETURN QUERY SELECT true, 'socratic'::TEXT, v.free_used, v.assists_used, v.socratic_used + 1;
  ELSE
    -- Exhausted: deny WITHOUT touching updated_at, so the reset cooldown keeps
    -- counting from the last real spend rather than restarting on every denied
    -- retry.
    RETURN QUERY SELECT false, 'exhausted'::TEXT, v.free_used, v.assists_used, v.socratic_used;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION spend_assist_ladder_turn(UUID, TEXT, INT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION spend_assist_ladder_turn(UUID, TEXT, INT, INT, INT) TO service_role;

-- 3. Tier-aware decrement-by-one refund (floor 0) for a turn that was spent
--    but never delivered (Gemini never billed). The route remembers which tier
--    the spend landed in and hands back exactly that tier's counter — the
--    ladder sibling of refund_challenge_assist.
CREATE OR REPLACE FUNCTION refund_assist_ladder_turn(
  p_user_id   UUID,
  p_lesson_id TEXT,
  p_tier      TEXT
) RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.challenge_assists
    SET
      free_used     = CASE WHEN p_tier = 'free'     THEN GREATEST(free_used - 1, 0)     ELSE free_used END,
      assists_used  = CASE WHEN p_tier = 'metered'  THEN GREATEST(assists_used - 1, 0)  ELSE assists_used END,
      socratic_used = CASE WHEN p_tier = 'socratic' THEN GREATEST(socratic_used - 1, 0) ELSE socratic_used END,
      updated_at = now()
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
$$;

REVOKE ALL ON FUNCTION refund_assist_ladder_turn(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION refund_assist_ladder_turn(UUID, TEXT, TEXT) TO service_role;

-- 4. Guarded self-serve reset (replaces the unguarded DELETE-row primitive,
--    which was an unlimited reset with zero callers). BOTH guards live inside
--    this SECURITY DEFINER body (R-6):
--      * once per (user, lesson): reset_used_at must be NULL;
--      * 7-day cooldown: at least 7 days since the lesson's last assist
--        activity (updated_at — frozen at the last allowed spend, since denials
--        deliberately do not touch it).
--    A successful reset zeroes all three tier counters and stamps
--    reset_used_at; chat_log and billed_assists are PRESERVED (the chat is the
--    learner's paid-for record; billed_assists is the never-decremented spend
--    audit). Worst case the per-lesson ceiling doubles to 60 turns and stops.
--    Return type changed, so DROP first (CREATE OR REPLACE cannot change it).
DROP FUNCTION IF EXISTS reset_challenge_assists(UUID, TEXT);
CREATE FUNCTION reset_challenge_assists(p_user_id UUID, p_lesson_id TEXT)
RETURNS TABLE (allowed BOOLEAN, reason TEXT, available_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v RECORD;
BEGIN
  SELECT ca.reset_used_at, ca.updated_at
    INTO v
    FROM public.challenge_assists ca
    WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'nothing_to_reset'::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF v.reset_used_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'already_used'::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF now() < v.updated_at + interval '7 days' THEN
    RETURN QUERY SELECT false, 'cooldown'::TEXT, v.updated_at + interval '7 days';
    RETURN;
  END IF;

  UPDATE public.challenge_assists ca
    SET free_used = 0,
        assists_used = 0,
        socratic_used = 0,
        reset_used_at = now(),
        updated_at = now()
    WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id;

  RETURN QUERY SELECT true, 'reset'::TEXT, NULL::TIMESTAMPTZ;
END;
$$;

REVOKE ALL ON FUNCTION reset_challenge_assists(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_challenge_assists(UUID, TEXT) TO service_role;

-- 5. Rehydration read, widened to the full ladder state. Return type changed,
--    so DROP first. reset_state mirrors (for DISPLAY only) the same rules the
--    reset RPC enforces — enforcement never leaves the RPC above.
DROP FUNCTION IF EXISTS get_challenge_assist_state(UUID, TEXT);
CREATE FUNCTION get_challenge_assist_state(p_user_id UUID, p_lesson_id TEXT)
RETURNS TABLE (
  free_turns INT,
  metered_turns INT,
  socratic_turns INT,
  reset_state TEXT,
  reset_available_at TIMESTAMPTZ,
  chat_log JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    ca.free_used,
    ca.assists_used,
    ca.socratic_used,
    CASE
      WHEN ca.reset_used_at IS NOT NULL THEN 'used'
      WHEN now() < ca.updated_at + interval '7 days' THEN 'cooldown'
      ELSE 'available'
    END,
    CASE
      WHEN ca.reset_used_at IS NULL THEN ca.updated_at + interval '7 days'
      ELSE NULL
    END,
    ca.chat_log
  FROM public.challenge_assists ca
  WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id;
$$;

REVOKE ALL ON FUNCTION get_challenge_assist_state(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_challenge_assist_state(UUID, TEXT) TO service_role;
