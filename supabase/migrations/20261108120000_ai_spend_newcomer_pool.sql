-- Migration: ai_spend_newcomer_pool
-- Two changes to the AI tutor spend ledger (20260726180000_ai_spend_ledger.sql).
--
-- 1. A shared daily pool for low-trust accounts. An account is low-trust when it
--    has no completed lesson, or its profile is less than 24 hours old, or it has
--    no profile. That is decided here from user_progress and profiles.created_at,
--    never from anything the caller passes. Low-trust spend is booked to the
--    'newcomer' bucket (scope_key '') on top of the account, IP and global
--    buckets, so those caps still apply. Established learners never touch it.
--
-- 2. Reserve, then settle. reserve_ai_spend runs before the model call: it locks
--    the day's buckets, picks a tier (full or degraded) and books that tier's
--    worst-case cost against every hard cap in one transaction, or denies if it
--    does not fit. settle_ai_spend runs after: it moves each bucket from the
--    reserved amount to the actual cost and counts the request. A call that was
--    never billed settles with actual 0 and billed false, which returns the
--    whole hold. A hold that is never settled stays booked at its worst case.
--
-- Caps and amounts are parameters, so they stay in env config (lib/env.server)
-- and move without a migration. The ledger stores no new personal data: the
-- pool row has an empty scope_key.
--
-- check_ai_spend and record_ai_spend are left in place for code deployed before
-- this migration; the app no longer calls them.
--
-- Idempotent: DROP CONSTRAINT IF EXISTS before ADD, CREATE OR REPLACE.

BEGIN;

ALTER TABLE public.ai_spend_ledger DROP CONSTRAINT IF EXISTS ai_spend_ledger_scope_check;
ALTER TABLE public.ai_spend_ledger ADD CONSTRAINT ai_spend_ledger_scope_check
  CHECK (scope IN ('account', 'ip', 'global', 'newcomer'));

-- Returns the decision ('full' | 'degraded' | 'denied'), the micro-USD held
-- (0 when denied), the America/Sao_Paulo day it was held on, and whether the
-- account was low-trust. settle_ai_spend takes the last three back.
--
-- Tier: 'full' when every bucket is under its soft cap and the full amount fits
-- under every hard cap; otherwise 'degraded' when the degraded amount fits;
-- otherwise 'denied'. Invalid input raises, and the caller treats an error as a
-- denial.
CREATE OR REPLACE FUNCTION public.reserve_ai_spend(
  p_user_id            UUID,
  p_ip                 TEXT,
  p_full_micro_usd     BIGINT,
  p_degraded_micro_usd BIGINT,
  p_account_soft       BIGINT,
  p_account_hard       BIGINT,
  p_ip_soft            BIGINT,
  p_ip_hard            BIGINT,
  p_global_soft        BIGINT,
  p_global_hard        BIGINT,
  p_newcomer_soft      BIGINT,
  p_newcomer_hard      BIGINT
) RETURNS TABLE (
  decision           TEXT,
  reserved_micro_usd BIGINT,
  reserved_day       DATE,
  low_trust          BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_day       DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_ip        TEXT := COALESCE(NULLIF(p_ip, ''), 'unknown');
  v_low_trust BOOLEAN;
  v_account   BIGINT;
  v_global    BIGINT;
  v_ip_total  BIGINT;
  v_pool      BIGINT;
  v_over_soft BOOLEAN;
  v_headroom  BIGINT;
  v_amount    BIGINT;
  v_decision  TEXT;
BEGIN
  IF num_nulls(p_user_id, p_full_micro_usd, p_degraded_micro_usd,
               p_account_soft, p_account_hard, p_ip_soft, p_ip_hard,
               p_global_soft, p_global_hard, p_newcomer_soft, p_newcomer_hard) > 0
     OR LEAST(p_full_micro_usd, p_degraded_micro_usd, p_account_soft, p_ip_soft,
              p_global_soft, p_newcomer_soft) < 0
     OR LEAST(p_account_hard, p_ip_hard, p_global_hard, p_newcomer_hard) <= 0 THEN
    RAISE EXCEPTION 'reserve_ai_spend: amounts and caps must be set, non-negative, and hard caps above zero'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_low_trust :=
    NOT EXISTS (
      SELECT 1 FROM public.user_progress up
       WHERE up.user_id = p_user_id AND up.completed
    )
    OR COALESCE(
      (SELECT p.created_at > now() - interval '24 hours'
         FROM public.profiles p WHERE p.id = p_user_id),
      true
    );

  -- Make sure today's rows exist so they can be locked. Rows are always taken in
  -- (scope, scope_key) order: account, global, ip, newcomer.
  INSERT INTO public.ai_spend_ledger (scope, scope_key, spend_day)
  VALUES ('account', p_user_id::text, v_day),
         ('global',  '',              v_day),
         ('ip',      v_ip,            v_day)
  ON CONFLICT (scope, scope_key, spend_day) DO NOTHING;
  IF v_low_trust THEN
    INSERT INTO public.ai_spend_ledger (scope, scope_key, spend_day)
    VALUES ('newcomer', '', v_day)
    ON CONFLICT (scope, scope_key, spend_day) DO NOTHING;
  END IF;

  SELECT l.micro_usd INTO v_account FROM public.ai_spend_ledger l
   WHERE l.scope = 'account' AND l.scope_key = p_user_id::text AND l.spend_day = v_day
   FOR UPDATE;
  SELECT l.micro_usd INTO v_global FROM public.ai_spend_ledger l
   WHERE l.scope = 'global' AND l.scope_key = '' AND l.spend_day = v_day
   FOR UPDATE;
  SELECT l.micro_usd INTO v_ip_total FROM public.ai_spend_ledger l
   WHERE l.scope = 'ip' AND l.scope_key = v_ip AND l.spend_day = v_day
   FOR UPDATE;
  IF v_low_trust THEN
    SELECT l.micro_usd INTO v_pool FROM public.ai_spend_ledger l
     WHERE l.scope = 'newcomer' AND l.scope_key = '' AND l.spend_day = v_day
     FOR UPDATE;
  END IF;

  v_over_soft := v_account >= p_account_soft
              OR v_ip_total >= p_ip_soft
              OR v_global >= p_global_soft
              OR (v_low_trust AND v_pool >= p_newcomer_soft);

  -- The smallest room left under any hard cap that applies. LEAST skips NULL, so
  -- the pool only counts for a low-trust account.
  v_headroom := LEAST(
    p_account_hard - v_account,
    p_ip_hard - v_ip_total,
    p_global_hard - v_global,
    CASE WHEN v_low_trust THEN p_newcomer_hard - v_pool END
  );

  IF NOT v_over_soft AND p_full_micro_usd <= v_headroom THEN
    v_decision := 'full';
    v_amount := p_full_micro_usd;
  ELSIF p_degraded_micro_usd <= v_headroom THEN
    v_decision := 'degraded';
    v_amount := p_degraded_micro_usd;
  ELSE
    RETURN QUERY SELECT 'denied'::text, 0::bigint, v_day, v_low_trust;
    RETURN;
  END IF;

  UPDATE public.ai_spend_ledger l
     SET micro_usd = l.micro_usd + v_amount,
         updated_at = now()
   WHERE l.spend_day = v_day
     AND (   (l.scope = 'account'  AND l.scope_key = p_user_id::text)
          OR (l.scope = 'global'   AND l.scope_key = '')
          OR (l.scope = 'ip'       AND l.scope_key = v_ip)
          OR (v_low_trust AND l.scope = 'newcomer' AND l.scope_key = ''));

  RETURN QUERY SELECT v_decision, v_amount, v_day, v_low_trust;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_ai_spend(UUID, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_spend(UUID, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT) TO service_role;

-- Moves the buckets a reservation touched from p_reserved_micro_usd to
-- p_actual_micro_usd on the day it was held (the delta can be negative or
-- positive; no bucket goes below zero). p_billed counts the request. A release
-- of an unbilled call is p_actual_micro_usd = 0, p_billed = false.
CREATE OR REPLACE FUNCTION public.settle_ai_spend(
  p_user_id            UUID,
  p_ip                 TEXT,
  p_spend_day          DATE,
  p_low_trust          BOOLEAN,
  p_reserved_micro_usd BIGINT,
  p_actual_micro_usd   BIGINT,
  p_billed             BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ip    TEXT := COALESCE(NULLIF(p_ip, ''), 'unknown');
  v_delta BIGINT;
BEGIN
  IF num_nulls(p_user_id, p_spend_day, p_low_trust, p_reserved_micro_usd,
               p_actual_micro_usd, p_billed) > 0
     OR p_reserved_micro_usd < 0 OR p_actual_micro_usd < 0 THEN
    RAISE EXCEPTION 'settle_ai_spend: arguments must be set and amounts non-negative'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_delta := p_actual_micro_usd - p_reserved_micro_usd;

  -- Same lock order as reserve_ai_spend.
  PERFORM 1 FROM public.ai_spend_ledger l
   WHERE l.spend_day = p_spend_day
     AND (   (l.scope = 'account'  AND l.scope_key = p_user_id::text)
          OR (l.scope = 'global'   AND l.scope_key = '')
          OR (l.scope = 'ip'       AND l.scope_key = v_ip)
          OR (p_low_trust AND l.scope = 'newcomer' AND l.scope_key = ''))
   ORDER BY l.scope, l.scope_key
   FOR UPDATE;

  UPDATE public.ai_spend_ledger l
     SET micro_usd = GREATEST(l.micro_usd + v_delta, 0),
         request_count = l.request_count + CASE WHEN p_billed THEN 1 ELSE 0 END,
         updated_at = now()
   WHERE l.spend_day = p_spend_day
     AND (   (l.scope = 'account'  AND l.scope_key = p_user_id::text)
          OR (l.scope = 'global'   AND l.scope_key = '')
          OR (l.scope = 'ip'       AND l.scope_key = v_ip)
          OR (p_low_trust AND l.scope = 'newcomer' AND l.scope_key = ''));
END;
$$;

REVOKE ALL ON FUNCTION public.settle_ai_spend(UUID, TEXT, DATE, BOOLEAN, BIGINT, BIGINT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_ai_spend(UUID, TEXT, DATE, BOOLEAN, BIGINT, BIGINT, BOOLEAN) TO service_role;

COMMIT;

-- Rollback (manual):
--   DROP FUNCTION IF EXISTS public.settle_ai_spend(UUID, TEXT, DATE, BOOLEAN, BIGINT, BIGINT, BOOLEAN);
--   DROP FUNCTION IF EXISTS public.reserve_ai_spend(UUID, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT);
--   DELETE FROM public.ai_spend_ledger WHERE scope = 'newcomer';
--   ALTER TABLE public.ai_spend_ledger DROP CONSTRAINT ai_spend_ledger_scope_check;
--   ALTER TABLE public.ai_spend_ledger ADD CONSTRAINT ai_spend_ledger_scope_check
--     CHECK (scope IN ('account', 'ip', 'global'));
