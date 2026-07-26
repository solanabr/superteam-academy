-- Migration: ai_spend_ledger (#591 — AI tutor spend caps)
-- The AI Partner spends a platform-funded (Superteam-sponsored) Gemini key.
-- `challenge_assists` counts TURNS per lesson, which is not spend — a turn can be
-- 200 output tokens or a truncated 8k propose. This ledger records the actual
-- micro-USD cost of every billed generation and enforces daily ceilings so a
-- single farmer cannot drain the sponsor's card before the invoice arrives.
--
-- Three daily buckets on America/Sao_Paulo days (AIE-21), one table keyed by
-- (scope, scope_key, spend_day):
--   * account — per-learner burn (scope_key = profiles.id)
--   * ip      — per-actor burn; free wallet signup means per-user keys alone
--               cannot bound a Sybil, so the IP dimension is the actor bound
--   * global  — the sponsor envelope backstop (scope_key = '')
--
-- The route reads the three current totals via check_ai_spend BEFORE calling
-- Gemini and picks a tier: under soft → full; over soft → DEGRADE (shorter
-- output budget); over hard → DENY. It records actual usage via record_ai_spend
-- AFTER the model bills us. Thresholds are config (env), derived downward from
-- the $500/mo sponsor commitment (O-1) — they are NOT baked into this SQL.
--
-- All RPCs follow the challenge_assists / award_xp hardening pattern: SECURITY
-- DEFINER, search_path-pinned, on an RLS-on table with NO policies, REVOKEd from
-- PUBLIC/anon/authenticated and GRANTed only to service_role. The TS wrapper
-- (apps/web/src/lib/ai/spend-ledger.ts) treats any check error as DENY — fail
-- CLOSED (the assist-budget contract, #590), never fail-open like check_rate_limit.
--
-- Additive + idempotent (IF NOT EXISTS / CREATE OR REPLACE). Mirrors the block
-- appended to supabase/schema.sql. Runs in one explicit transaction.

BEGIN;

-- Micro-USD (USD × 1e6) as BIGINT — integer money, no float drift. A single
-- day's global envelope is ~$25 = 25,000,000 micro, far inside BIGINT range.
CREATE TABLE IF NOT EXISTS ai_spend_ledger (
  scope         TEXT NOT NULL,
  scope_key     TEXT NOT NULL,
  spend_day     DATE NOT NULL,
  micro_usd     BIGINT NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, scope_key, spend_day),
  CONSTRAINT ai_spend_ledger_scope_check CHECK (scope IN ('account', 'ip', 'global'))
);

ALTER TABLE ai_spend_ledger ENABLE ROW LEVEL SECURITY;
-- No policies: reached only through SECURITY DEFINER RPCs called by service_role.

-- Add p_micro_usd to all three of today's buckets in one upsert. Called AFTER a
-- confirmed Gemini bill, best-effort from the route (never blocks the paid
-- reply). Negative input is clamped to 0 so a bad estimate can only under-count,
-- never credit. The SP-day is computed here so callers never pass a clock.
CREATE OR REPLACE FUNCTION record_ai_spend(
  p_user_id   UUID,
  p_ip        TEXT,
  p_micro_usd BIGINT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_day    DATE   := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_amount BIGINT := GREATEST(COALESCE(p_micro_usd, 0), 0);
  v_ip     TEXT   := COALESCE(NULLIF(p_ip, ''), 'unknown');
BEGIN
  INSERT INTO public.ai_spend_ledger (scope, scope_key, spend_day, micro_usd, request_count, updated_at)
  VALUES
    ('account', p_user_id::text, v_day, v_amount, 1, now()),
    ('ip',      v_ip,            v_day, v_amount, 1, now()),
    ('global',  '',              v_day, v_amount, 1, now())
  ON CONFLICT (scope, scope_key, spend_day)
  DO UPDATE SET
    micro_usd     = public.ai_spend_ledger.micro_usd + EXCLUDED.micro_usd,
    request_count = public.ai_spend_ledger.request_count + 1,
    updated_at    = now();
END;
$$;

REVOKE ALL ON FUNCTION record_ai_spend(UUID, TEXT, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_ai_spend(UUID, TEXT, BIGINT) TO service_role;

-- Read today's accumulated micro-USD for the account, IP, and global buckets in
-- one call. The route compares these to the env thresholds to pick full/degrade/
-- deny — the decision (and thus the thresholds) live in TS, not here, so caps
-- move with the sponsor commitment without a migration.
CREATE OR REPLACE FUNCTION check_ai_spend(
  p_user_id UUID,
  p_ip      TEXT
) RETURNS TABLE (account_micro_usd BIGINT, ip_micro_usd BIGINT, global_micro_usd BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE((SELECT micro_usd FROM public.ai_spend_ledger
      WHERE scope = 'account' AND scope_key = p_user_id::text
        AND spend_day = (now() AT TIME ZONE 'America/Sao_Paulo')::date), 0),
    COALESCE((SELECT micro_usd FROM public.ai_spend_ledger
      WHERE scope = 'ip' AND scope_key = COALESCE(NULLIF(p_ip, ''), 'unknown')
        AND spend_day = (now() AT TIME ZONE 'America/Sao_Paulo')::date), 0),
    COALESCE((SELECT micro_usd FROM public.ai_spend_ledger
      WHERE scope = 'global' AND scope_key = ''
        AND spend_day = (now() AT TIME ZONE 'America/Sao_Paulo')::date), 0);
$$;

REVOKE ALL ON FUNCTION check_ai_spend(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_ai_spend(UUID, TEXT) TO service_role;

-- Admin observability: the global burn for the current SP day, so the sponsor's
-- spend is visible BEFORE the invoice (issue "Done when"). service_role only.
CREATE OR REPLACE FUNCTION get_ai_spend_today()
RETURNS TABLE (micro_usd BIGINT, request_count INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE(l.micro_usd, 0),
    COALESCE(l.request_count, 0)
  FROM (SELECT 1) AS one
  LEFT JOIN public.ai_spend_ledger l
    ON l.scope = 'global' AND l.scope_key = ''
   AND l.spend_day = (now() AT TIME ZONE 'America/Sao_Paulo')::date;
$$;

REVOKE ALL ON FUNCTION get_ai_spend_today() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ai_spend_today() TO service_role;

COMMIT;

-- Rollback (manual):
--   DROP FUNCTION IF EXISTS public.get_ai_spend_today();
--   DROP FUNCTION IF EXISTS public.check_ai_spend(UUID, TEXT);
--   DROP FUNCTION IF EXISTS public.record_ai_spend(UUID, TEXT, BIGINT);
--   DROP TABLE IF EXISTS public.ai_spend_ledger;
