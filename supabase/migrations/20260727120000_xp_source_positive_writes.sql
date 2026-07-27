-- ============================================================================
-- Migration: write xp_transactions.source POSITIVELY at the award_xp call site
-- (#736).
--
-- THE PROBLEM: xp_transactions.source (the column the cohort-league anti-gaming
-- allowlist filters on, LX-B9a / #574) is REVERSE-DERIVED from the free-text
-- reason prefix by xp_source_for_reason(), whose ELSE -> 'platform' is the only
-- thing excluding an arbitrary award. The on-chain XpRewarded instruction takes
-- an authority-supplied memo; a promo shaped as 'Completed lesson: ...' would
-- derive to 'lesson' and score as league-eligible. Not urgent (memos are
-- authority-only; leagues are display-only; the 5000/day cap bounds volume) —
-- but source should be a POSITIVE FACT each writer states, not an inference.
--
-- THE FIX: award_xp gains a `p_source TEXT` parameter. When the caller passes a
-- source it is used verbatim; when NULL it falls back to xp_source_for_reason()
-- (unchanged) so any un-migrated caller keeps its current behaviour. The call
-- sites now pass their true source explicitly — critically, the XpRewarded
-- arbitrary-memo path passes 'platform', so a promo can never masquerade as
-- league-eligible regardless of its memo. xp_source_for_reason() is demoted to
-- the default/backfill helper it always should have been.
--
-- award_community_xp already writes 'community' positively (hardcoded) — it is
-- not reverse-derived, so it is unchanged.
--
-- ⚠ HARD DEPENDENCY — APPLY AFTER 20260726190000_streak_forgiveness (its bodies,
-- not just its schema half). This migration's award_xp body is the CURRENT
-- in-tree body, which calls public.next_streak_value() (added by 190000). On a
-- database where 190000's FUNCTION BODIES are not yet applied (e.g. prod as of
-- 2026-07-27 — its schema half is applied, its bodies are blocked on #750/#758,
-- see docs/DB-MIGRATION-LEDGER.md), award_xp would reference an undefined
-- function and every XP award would error at runtime. Sequence: land #758 →
-- apply 190000 bodies → apply this. This is the #750 "which prod state does it
-- assume" discipline made explicit. Snapshot pg_get_functiondef for award_xp
-- before applying (CREATE OR REPLACE is only reversible if the prior body was
-- captured); the self-contained rollback below also restores it verbatim.
--
-- Signature change (5 -> 6 args) means CREATE OR REPLACE cannot edit in place:
-- DROP the 5-arg function, CREATE the 6-arg one. award_xp is called only from
-- service_role TS (no SQL object depends on it), so the drop has no cascade.
-- Idempotent: DROP IF EXISTS + CREATE OR REPLACE. Explicit BEGIN/COMMIT.
-- Mirrored into supabase/schema.sql.
-- ============================================================================

BEGIN;

-- Drop the 5-arg signature so the 6-arg definition below is unambiguous (a
-- lingering 5-arg overload would make named-arg calls resolve non-deterministically).
DROP FUNCTION IF EXISTS award_xp(UUID, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT DEFAULT NULL,
  p_tx_signature TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL
) RETURNS INTEGER
-- Returns the amount actually credited (after per-award + daily-cap clamps).
--   > 0 → XP landed (or, for an idempotency-key duplicate, had already landed —
--         the previously-credited amount is returned so callers can treat
--         "already delivered" as delivered).
--   = 0 → nothing was credited (invalid amount, or the daily cap consumed the
--         whole award). Queue-style callers MUST NOT mark delivery resolved
--         on 0 — the credit was dropped, not delivered.
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
  -- Typed source (LX-B9a / #736). POSITIVE by default: the caller states it via
  -- p_source. Falls back to the reason-prefix derivation (xp_source_for_reason)
  -- only when the caller passes NULL, so un-migrated callers are unaffected and
  -- old-row backfill still shares one mapping.
  v_source TEXT;
  c_max_award_xp CONSTANT INTEGER := 2000;
  c_max_daily_award_xp CONSTANT INTEGER := 5000;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN 0;
  END IF;

  IF p_amount > c_max_award_xp THEN
    p_amount := c_max_award_xp;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('award_xp:' || p_user_id::text)::bigint);

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

  -- Positive source wins; derivation is the fallback for NULL (#736).
  v_source := COALESCE(p_source, public.xp_source_for_reason(p_reason));

  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.xp_transactions (user_id, amount, reason, source, idempotency_key, tx_signature)
    VALUES (p_user_id, p_amount, p_reason, v_source, p_idempotency_key, p_tx_signature)
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    IF NOT FOUND THEN
      SELECT amount INTO v_prev_amount
      FROM public.xp_transactions
      WHERE user_id = p_user_id
        AND idempotency_key = p_idempotency_key;
      RETURN COALESCE(v_prev_amount, 0);
    END IF;
  ELSE
    INSERT INTO public.xp_transactions (user_id, amount, reason, source, tx_signature)
    VALUES (p_user_id, p_amount, p_reason, v_source, p_tx_signature);
  END IF;

  -- Get current streak state, then apply the shared forgiveness-aware decision.
  -- next_streak_value consumes freezes (and logs frozen days) on a forgiven gap
  -- BEFORE the upsert below writes the surviving streak — same row, one txn.
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.user_xp
  WHERE user_id = p_user_id;

  v_new_streak := public.next_streak_value(p_user_id, v_last_activity, v_current_streak, CURRENT_DATE);
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

REVOKE EXECUTE ON FUNCTION award_xp FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION award_xp TO service_role;

COMMIT;

-- ============================================================================
-- ROLLBACK (self-contained) — restores the pre-#736 award_xp (5-arg, source
-- reverse-derived). Inlines the prior body verbatim; no cross-file reference
-- (the #750 lesson). ASSUMES the same prod state this migration assumes —
-- 190000's bodies applied — because the restored body also calls
-- next_streak_value; on a DB without it, restore from your pre-apply
-- pg_get_functiondef snapshot instead. Run as one transaction:
-- ----------------------------------------------------------------------------
-- BEGIN;
-- DROP FUNCTION IF EXISTS award_xp(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT);
-- CREATE OR REPLACE FUNCTION award_xp(
--   p_user_id UUID,
--   p_amount INTEGER,
--   p_reason TEXT,
--   p_idempotency_key TEXT DEFAULT NULL,
--   p_tx_signature TEXT DEFAULT NULL
-- ) RETURNS INTEGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- DECLARE
--   v_last_activity DATE;
--   v_current_streak INTEGER;
--   v_longest_streak INTEGER;
--   v_new_streak INTEGER;
--   v_new_longest INTEGER;
--   v_daily_total INTEGER;
--   v_prev_amount INTEGER;
--   v_source TEXT;
--   c_max_award_xp CONSTANT INTEGER := 2000;
--   c_max_daily_award_xp CONSTANT INTEGER := 5000;
-- BEGIN
--   IF p_amount IS NULL OR p_amount <= 0 THEN RETURN 0; END IF;
--   IF p_amount > c_max_award_xp THEN p_amount := c_max_award_xp; END IF;
--   PERFORM pg_advisory_xact_lock(hashtext('award_xp:' || p_user_id::text)::bigint);
--   SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
--   FROM public.xp_transactions
--   WHERE user_id = p_user_id
--     AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
--     AND reason NOT LIKE 'community:%';
--   IF v_daily_total >= c_max_daily_award_xp THEN RETURN 0; END IF;
--   IF v_daily_total + p_amount > c_max_daily_award_xp THEN p_amount := c_max_daily_award_xp - v_daily_total; END IF;
--   IF p_amount <= 0 THEN RETURN 0; END IF;
--   v_source := public.xp_source_for_reason(p_reason);
--   IF p_idempotency_key IS NOT NULL THEN
--     INSERT INTO public.xp_transactions (user_id, amount, reason, source, idempotency_key, tx_signature)
--     VALUES (p_user_id, p_amount, p_reason, v_source, p_idempotency_key, p_tx_signature)
--     ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
--     IF NOT FOUND THEN
--       SELECT amount INTO v_prev_amount FROM public.xp_transactions
--       WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
--       RETURN COALESCE(v_prev_amount, 0);
--     END IF;
--   ELSE
--     INSERT INTO public.xp_transactions (user_id, amount, reason, source, tx_signature)
--     VALUES (p_user_id, p_amount, p_reason, v_source, p_tx_signature);
--   END IF;
--   SELECT last_activity_date, current_streak, longest_streak
--   INTO v_last_activity, v_current_streak, v_longest_streak
--   FROM public.user_xp WHERE user_id = p_user_id;
--   v_new_streak := public.next_streak_value(p_user_id, v_last_activity, v_current_streak, CURRENT_DATE);
--   v_new_longest := GREATEST(COALESCE(v_longest_streak, 0), v_new_streak);
--   INSERT INTO public.user_xp (user_id, total_xp, level, last_activity_date, current_streak, longest_streak)
--   VALUES (p_user_id, p_amount, floor(sqrt(p_amount / 100.0))::int, CURRENT_DATE, v_new_streak, v_new_longest)
--   ON CONFLICT (user_id) DO UPDATE SET
--     total_xp = user_xp.total_xp + p_amount,
--     level = floor(sqrt((user_xp.total_xp + p_amount) / 100.0))::int,
--     last_activity_date = CURRENT_DATE,
--     current_streak = v_new_streak,
--     longest_streak = v_new_longest;
--   RETURN p_amount;
-- END;
-- $$;
-- REVOKE EXECUTE ON FUNCTION award_xp FROM authenticated, anon, public;
-- GRANT EXECUTE ON FUNCTION award_xp TO service_role;
-- COMMIT;
-- ============================================================================
