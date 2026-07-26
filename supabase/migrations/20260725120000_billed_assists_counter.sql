-- Migration: billed_assists_counter (#590 — AI cost holes)
-- Records that a BILLED Gemini generation occurred, independent of the
-- refundable per-(user, lesson) paid-assist quota. The route now refunds an
-- assist ONLY when Gemini was not billed (!response.ok / a pre-200 network
-- throw); a successful-but-useless generation (empty / non-JSON / MAX_TOKENS
-- truncation) is billed cost and no longer refunds. `billed_assists` is the
-- durable, never-decremented audit trail of that spend against the
-- platform-funded key.
--
-- Additive + idempotent — safe to run on an existing database. Mirrors the
-- definitions added to supabase/schema.sql. record_billed_assist follows the
-- exact hardening pattern of the other challenge_assists RPCs: SECURITY
-- DEFINER, search_path-pinned, RLS-on table with no policies, REVOKE from
-- PUBLIC/anon/authenticated, GRANT to service_role only.

-- 1. Non-refundable, monotonic count of billed generations for a (user, lesson).
ALTER TABLE challenge_assists
  ADD COLUMN IF NOT EXISTS billed_assists INTEGER NOT NULL DEFAULT 0;

-- 2. Increment-by-one on each confirmed Gemini 200. Never decremented. The row
--    already exists (spend_challenge_assist upserted it on the same paid call),
--    but upsert defensively.
CREATE OR REPLACE FUNCTION record_billed_assist(p_user_id UUID, p_lesson_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.challenge_assists (user_id, lesson_id, billed_assists, updated_at)
  VALUES (p_user_id, p_lesson_id, 1, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    billed_assists = public.challenge_assists.billed_assists + 1,
    updated_at = now();
$$;

REVOKE ALL ON FUNCTION record_billed_assist(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_billed_assist(UUID, TEXT) TO service_role;
