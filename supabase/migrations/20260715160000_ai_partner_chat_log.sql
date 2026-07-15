-- AI Partner chat-log persistence (per learner + lesson).
-- Additive + idempotent — safe to run on an existing database. Mirrors the
-- definitions added to supabase/schema.sql.

-- 1. Store the rendered chat turns alongside the existing paid-assist counter.
ALTER TABLE challenge_assists
  ADD COLUMN IF NOT EXISTS chat_log JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Append rendered turns (JSONB array of PartnerMessage) to a learner's log.
CREATE OR REPLACE FUNCTION append_challenge_assist_log(
  p_user_id   UUID,
  p_lesson_id TEXT,
  p_entries   JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_entries IS NULL OR jsonb_typeof(p_entries) <> 'array' THEN
    RETURN;
  END IF;
  INSERT INTO public.challenge_assists (user_id, lesson_id, chat_log, updated_at)
  VALUES (p_user_id, p_lesson_id, p_entries, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    chat_log = public.challenge_assists.chat_log || EXCLUDED.chat_log,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION append_challenge_assist_log(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION append_challenge_assist_log(UUID, TEXT, JSONB) TO service_role;

-- 3. Read a learner's paid-assist count + chat log for pane rehydration.
CREATE OR REPLACE FUNCTION get_challenge_assist_state(p_user_id UUID, p_lesson_id TEXT)
RETURNS TABLE (assists_used INT, chat_log JSONB)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT assists_used, chat_log
  FROM public.challenge_assists
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
$$;

REVOKE ALL ON FUNCTION get_challenge_assist_state(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_challenge_assist_state(UUID, TEXT) TO service_role;
