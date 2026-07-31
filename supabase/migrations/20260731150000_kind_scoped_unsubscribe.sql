-- ============================================================================
-- Migration: kind_scoped_unsubscribe — one token per consent kind (#896)
--
-- DEFECT (F6 of #895's adversarial review; pre-existing from #779/#869, NOT a
-- #895 regression). Marketing consent (`opt_in`) and reminder consent
-- (`reminder_opt_in`) live on the same `email_subscriptions` row and SHARED one
-- secret: `unsubscribe_token`. The kind separation was real at the RPC level
-- (`unsubscribe_by_token` vs `unsubscribe_reminders_by_token`) but NOT at the
-- token level, so the kind was just a query-string hint the caller controls:
--
--   * token lifted from a REMINDER email, `&kind=reminders` stripped
--     → unsubscribe_by_token(tok) matched → MARKETING consent killed;
--   * token lifted from a MARKETING email, `&kind=reminders` appended
--     → unsubscribe_reminders_by_token(tok) matched → REMINDER consent killed.
--
-- Bounded (the token holder is the recipient; the effect is less mail, which is
-- the fail-safe direction) but it silently revokes a consent the learner never
-- acted on, and LGPD consent is purpose-bound — a consent record must reflect
-- what the learner actually did.
--
-- FIX SHAPE (the issue offers "per-kind tokens" or "a signed kind claim"; this
-- takes the first, which needs no key management and no token format change).
-- A SECOND secret column, `reminder_unsubscribe_token`, distinct from the
-- marketing one on every row, plus each unsubscribe RPC matching ONLY its own
-- column. Cross-kind then fails at the database, not at a caller-supplied
-- parameter: a marketing token simply is not a value that exists in the reminder
-- column, so `unsubscribe_reminders_by_token(marketing_tok)` matches zero rows
-- and returns false — and vice versa. `chk_email_subscriptions_distinct_tokens`
-- makes "the two secrets are never equal" a table invariant so no future
-- backfill can quietly re-merge them.
--
-- BACKWARD COMPATIBILITY (already-issued, unscoped tokens):
--   * MARKETING links are GRANDFATHERED. `unsubscribe_token` keeps its value and
--     keeps meaning "marketing" — the kind it was originally issued for. Every
--     marketing link ever minted (all of them kind-less, #779) still works, and
--     the route's kind-less default is still marketing.
--   * REMINDER links minted before this migration are EXPIRED, deliberately.
--     They carry the MARKETING token with `&kind=reminders`; honouring them
--     would mean keeping exactly the cross-kind match this migration removes, so
--     there is no way to grandfather them without preserving the defect. They
--     now hit the route's "Link not recognized" page, which points at Settings
--     (where both consents are toggleable) — a bounded, fail-safe degradation.
--     Blast radius is ~zero: reminder consent defaults FALSE and both the
--     settings toggle (#869) and the daily cron shipped the same day as this
--     fix, so essentially no reminder mail carrying an old token is in flight.
--     No token ROTATION is performed for the same reason marketing is
--     grandfathered: rotating `unsubscribe_token` would break live marketing
--     links to fix nothing (the marketing token is still exactly the marketing
--     secret).
--
-- ALSO UPDATED: `claim_due_session_reminders` now hands the send pipeline the
-- REMINDER token (its `unsubscribe_token` OUT column name is unchanged so the
-- signature — and therefore the app read — is untouched; only the source column
-- changes). `list_marketing_recipients` is correct as-is: it already returns the
-- marketing token for the marketing pipeline.
--
-- SECURITY MODEL: unchanged from #779/#869 and re-stated here because
-- CREATE OR REPLACE does not carry grants forward on a signature change and
-- re-stating them is the house pattern. Every function stays SECURITY DEFINER,
-- `SET search_path = ''`, REVOKEd from PUBLIC/anon/authenticated and GRANTed to
-- service_role ALONE. These unsubscribe RPCs are NOT anon-callable in this
-- codebase (unlike the common Supabase shape): the unauthenticated one-click
-- endpoint is the Next.js route `/api/email/unsubscribe`, which calls them with
-- the service-role client. That intent is preserved exactly — nothing here
-- widens a grant. No new RLS policy: `email_subscriptions` still has own-row
-- SELECT only and NO client write path, so a learner cannot read another
-- learner's tokens (nor, in fact, write their own consent columns directly).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, guarded constraint DO blocks, a backfill
-- that only touches NULLs, CREATE OR REPLACE FUNCTION. Explicit BEGIN/COMMIT.
-- Tested ROLLBACK + post-apply invariant checks at the bottom. Mirrored into
-- supabase/schema.sql.
--
-- Replays cleanly on the PROD lineage: it depends on nothing beyond
-- 20260728120000_email_subscriptions.sql and 20260731120000_reminder_consent.sql
-- (prod ledger 20260727200924 and 20260731120914).
-- ============================================================================

BEGIN;

-- ── 1. reminder_unsubscribe_token — the per-kind secret ─────────────────────
-- Added NULLable, backfilled per row, then pinned NOT NULL + DEFAULT. (An
-- ADD COLUMN with a volatile default does evaluate per row on modern Postgres,
-- but the explicit three-step is unambiguous and re-runnable.)
ALTER TABLE email_subscriptions
  ADD COLUMN IF NOT EXISTS reminder_unsubscribe_token UUID;

-- One FRESH secret per existing row — never a copy of the marketing token, which
-- would re-create the shared-secret defect on day one.
UPDATE email_subscriptions
SET reminder_unsubscribe_token = gen_random_uuid()
WHERE reminder_unsubscribe_token IS NULL;

ALTER TABLE email_subscriptions
  ALTER COLUMN reminder_unsubscribe_token SET DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'email_subscriptions'
      AND column_name = 'reminder_unsubscribe_token'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.email_subscriptions
      ALTER COLUMN reminder_unsubscribe_token SET NOT NULL;
  END IF;
END;
$$;

-- A token maps to exactly one user (same guarantee the marketing token has).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_subscriptions_reminder_token_unique'
  ) THEN
    ALTER TABLE public.email_subscriptions
      ADD CONSTRAINT email_subscriptions_reminder_token_unique
      UNIQUE (reminder_unsubscribe_token);
  END IF;
END;
$$;

-- THE invariant this migration exists for: the two consents never share a
-- secret. Enforced by the table, so no later backfill/restore can undo #896 by
-- copying one column into the other.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_email_subscriptions_distinct_tokens'
  ) THEN
    ALTER TABLE public.email_subscriptions
      ADD CONSTRAINT chk_email_subscriptions_distinct_tokens
      CHECK (reminder_unsubscribe_token <> unsubscribe_token);
  END IF;
END;
$$;

-- ── 2. unsubscribe_reminders_by_token — REMINDER token only ─────────────────
-- Matches `reminder_unsubscribe_token` and nothing else. A marketing token now
-- matches zero rows here, so the cross-kind flip returns false and writes
-- nothing. Still clears ONLY the reminder columns. Idempotent.
CREATE OR REPLACE FUNCTION unsubscribe_reminders_by_token(p_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- INTEGER, not BOOLEAN: GET DIAGNOSTICS yields a row count (#779's bug).
  v_matched INTEGER;
BEGIN
  UPDATE public.email_subscriptions
  SET reminder_opt_in = false,
      reminder_unsubscribed_at = now(),
      updated_at = now()
  -- #896: the REMINDER secret, not the shared one. Do NOT add an OR on
  -- `unsubscribe_token` "for old links" — that is the vulnerability.
  WHERE reminder_unsubscribe_token = p_token;
  GET DIAGNOSTICS v_matched = ROW_COUNT;
  RETURN v_matched > 0;
END;
$$;

REVOKE ALL ON FUNCTION unsubscribe_reminders_by_token(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION unsubscribe_reminders_by_token(UUID) TO service_role;

-- ── 3. unsubscribe_by_token — MARKETING token only ──────────────────────────
-- Body unchanged (it already matched only `unsubscribe_token`); re-stated so the
-- two halves of the kind scoping live in one place and so the reminder token —
-- a value that exists only in the other column — provably cannot reach it.
CREATE OR REPLACE FUNCTION unsubscribe_by_token(p_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_matched INTEGER;
BEGIN
  UPDATE public.email_subscriptions
  SET opt_in = false, unsubscribed_at = now(), updated_at = now()
  -- #896: MARKETING secret only. Grandfathered — every marketing link ever
  -- minted carries this value and keeps working.
  WHERE unsubscribe_token = p_token;
  GET DIAGNOSTICS v_matched = ROW_COUNT;
  RETURN v_matched > 0;
END;
$$;

REVOKE ALL ON FUNCTION unsubscribe_by_token(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION unsubscribe_by_token(UUID) TO service_role;

-- ── 4. claim_due_session_reminders — hand out the REMINDER token ────────────
-- Identical to #869 except the token column. The OUT column keeps the name
-- `unsubscribe_token` so the signature (and the pipeline's read) is unchanged;
-- CREATE OR REPLACE cannot rename OUT columns, and renaming would force a DROP.
CREATE OR REPLACE FUNCTION claim_due_session_reminders(p_weekday TEXT DEFAULT NULL)
RETURNS TABLE (user_id UUID, email TEXT, unsubscribe_token UUID, locale TEXT, plan_time TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_column
DECLARE
  v_today   DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_weekday TEXT := COALESCE(
    p_weekday,
    trim(to_char((now() AT TIME ZONE 'America/Sao_Paulo'), 'dy'))
  );
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT
      es.user_id                                     AS uid,
      u.email::text                                  AS mail,
      -- #896: the reminder-scoped secret. A reminder email must never carry the
      -- marketing token.
      es.reminder_unsubscribe_token                  AS tok,
      es.reminder_locale                             AS loc,
      COALESCE(p.prefs -> 'nextLesson' ->> 'time', '') AS ptime
    FROM public.email_subscriptions es
    JOIN auth.users u ON u.id = es.user_id
    JOIN public.profiles p ON p.id = es.user_id
    WHERE es.reminder_opt_in = true
      AND u.email IS NOT NULL
      AND u.email <> ''
      AND u.email NOT LIKE '%@wallet.superteam-lms.local'
      AND p.prefs -> 'nextLesson' ->> 'day' = v_weekday
  ),
  claimed AS (
    INSERT INTO public.email_reminder_log (user_id, kind, sent_on)
    SELECT due.uid, 'session_plan', v_today FROM due
    ON CONFLICT (user_id, kind, sent_on) DO NOTHING
    RETURNING email_reminder_log.user_id AS uid
  )
  SELECT d.uid, d.mail, d.tok, d.loc, d.ptime
  FROM due d
  JOIN claimed c ON c.uid = d.uid
  ORDER BY d.uid;
END;
$$;

REVOKE ALL ON FUNCTION claim_due_session_reminders(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_due_session_reminders(TEXT) TO service_role;

COMMIT;

-- ============================================================================
-- POST-APPLY INVARIANT CHECKS (run as the gate after applying; all must hold)
-- ----------------------------------------------------------------------------
-- 1. Every row has a reminder token and it NEVER equals the marketing one:
--    SELECT count(*) FILTER (WHERE reminder_unsubscribe_token IS NULL)          AS null_tokens,
--           count(*) FILTER (WHERE reminder_unsubscribe_token = unsubscribe_token) AS shared_tokens,
--           count(DISTINCT reminder_unsubscribe_token) AS distinct_tokens,
--           count(*) AS rows
--    FROM public.email_subscriptions;
--    ⇒ null_tokens = 0, shared_tokens = 0, distinct_tokens = rows.
--
-- 2. Both constraints exist:
--    SELECT conname FROM pg_constraint
--    WHERE conname IN ('email_subscriptions_reminder_token_unique',
--                      'chk_email_subscriptions_distinct_tokens');
--    ⇒ 2 rows.
--
-- 3. Cross-kind is dead (read-only probe; picks any row, expects both false):
--    WITH s AS (SELECT unsubscribe_token m, reminder_unsubscribe_token r
--               FROM public.email_subscriptions LIMIT 1)
--    SELECT (SELECT count(*) FROM public.email_subscriptions e, s
--            WHERE e.reminder_unsubscribe_token = s.m) AS marketing_tok_hits_reminder,
--           (SELECT count(*) FROM public.email_subscriptions e, s
--            WHERE e.unsubscribe_token = s.r)          AS reminder_tok_hits_marketing
--    FROM s;
--    ⇒ both 0.
--
-- 4. Grants unchanged — service_role ONLY, no anon/authenticated EXECUTE:
--    SELECT p.proname, r.rolname, has_function_privilege(r.rolname, p.oid, 'EXECUTE') ex
--    FROM pg_proc p CROSS JOIN (VALUES ('anon'),('authenticated'),('service_role')) r(rolname)
--    WHERE p.proname IN ('unsubscribe_by_token','unsubscribe_reminders_by_token',
--                        'claim_due_session_reminders');
--    ⇒ ex = true ONLY for service_role.
--
-- 5. The claim RPC hands out the reminder token:
--    SELECT prosrc LIKE '%es.reminder_unsubscribe_token%' AS ok
--    FROM pg_proc WHERE proname = 'claim_due_session_reminders';  ⇒ true.
-- ============================================================================

-- ============================================================================
-- ROLLBACK (tested; not executed by the migration runner)
-- ----------------------------------------------------------------------------
-- Restores the #869 bodies (which re-shares the token — only roll back if #896
-- itself is the problem).
-- BEGIN;
--   ALTER TABLE email_subscriptions
--     DROP CONSTRAINT IF EXISTS chk_email_subscriptions_distinct_tokens,
--     DROP CONSTRAINT IF EXISTS email_subscriptions_reminder_token_unique,
--     DROP COLUMN IF EXISTS reminder_unsubscribe_token;
--   -- then re-run §4 and §6 of 20260731120000_reminder_consent.sql.
-- COMMIT;
-- ============================================================================
