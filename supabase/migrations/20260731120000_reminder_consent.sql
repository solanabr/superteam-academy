-- ============================================================================
-- Migration: reminder_consent — session-plan reminder consent + send ledger (#869)
--
-- #779 gave us MARKETING consent (`email_subscriptions.opt_in`). A learner who
-- wants product news has NOT thereby asked to be nudged about their own study
-- plan, and vice versa. LGPD consent is purpose-bound, so the session-plan
-- reminder gets its OWN opt-in flag, its OWN consent/unsubscribe timestamps, and
-- its OWN unsubscribe path. Reminder consent is NEVER inferred from marketing
-- consent (or the reverse) anywhere in SQL or in the app.
--
-- WHAT THIS ADDS
--   1. email_subscriptions.reminder_opt_in / reminder_consent_at /
--      reminder_unsubscribed_at / reminder_locale — the second consent type on
--      the existing one-row-per-user consent table (same tight RLS, same secret
--      unsubscribe token, no new leak surface). DEFAULT FALSE: opt-out unless a
--      learner explicitly opted in.
--   2. email_reminder_log — the idempotency ledger. PRIMARY KEY
--      (user_id, kind, sent_on) makes "one reminder per learner per São Paulo
--      day" a DATABASE invariant, not a code convention: a re-run of the cron on
--      the same day claims zero rows.
--   3. set_reminder_opt_in(BOOLEAN, TEXT)   — authenticated self-service toggle.
--      claim_due_session_reminders(TEXT)    — service_role: the send pipeline's
--                                             ATOMIC claim-then-send read.
--      release_session_reminder_claims(...) — service_role: release a claim whose
--                                             batch failed, so a retry can send.
--      unsubscribe_reminders_by_token(UUID) — service_role: one-click unsubscribe
--                                             that clears REMINDER consent only.
--
-- WHY CLAIM-BEFORE-SEND. The recipient read and the "already sent today" write
-- are ONE statement (CTE with INSERT … ON CONFLICT DO NOTHING RETURNING). Two
-- overlapping cron invocations therefore cannot both claim the same learner —
-- the second gets zero rows — so no learner can be double-emailed even if the
-- scheduler fires twice or a deploy overlaps a run. A batch that fails to send
-- calls release_session_reminder_claims so the day is retryable.
--
-- TIMEZONE. Everything is evaluated on the America/Sao_Paulo calendar day (the
-- learner base is Brazil; the plan the learner committed is a local weekday).
-- Brazil has had no DST since 2019, so the offset is a stable UTC-3.
--
-- SECURITY MODEL (house pattern — review_items / challenge_assists / #779):
--   * email_reminder_log has RLS ON and NO policies at all: it is service-role-
--     only bookkeeping. anon/authenticated can neither read nor write it, so a
--     learner cannot forge or erase a send record.
--   * No client write policy is added to email_subscriptions — consent writes
--     still go only through SECURITY DEFINER RPCs, so the consent TIMESTAMPS
--     stay server-authoritative and cannot be backdated.
--   * Every function is SECURITY DEFINER, search_path-pinned to '', REVOKEd from
--     PUBLIC/anon and GRANTed to exactly one role.
--
-- Idempotent: ADD COLUMN/CREATE TABLE/INDEX IF NOT EXISTS, CREATE OR REPLACE
-- FUNCTION. Explicit BEGIN/COMMIT. Tested ROLLBACK at the bottom. Mirrored into
-- supabase/schema.sql.
-- ============================================================================

BEGIN;

-- ── 1. Reminder consent columns on email_subscriptions ──────────────────────
ALTER TABLE email_subscriptions
  -- Session-plan reminder opt-in. DEFAULT FALSE — a marketing opt-in must never
  -- imply this, and neither must a committed plan on its own.
  ADD COLUMN IF NOT EXISTS reminder_opt_in BOOLEAN NOT NULL DEFAULT false,
  -- Independent LGPD audit trail for THIS purpose.
  ADD COLUMN IF NOT EXISTS reminder_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_unsubscribed_at TIMESTAMPTZ,
  -- Locale captured at opt-in so the send can address the learner in their own
  -- language without a session (a cron run has none). NULL → app default.
  ADD COLUMN IF NOT EXISTS reminder_locale TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_email_subscriptions_reminder_locale'
  ) THEN
    ALTER TABLE email_subscriptions
      ADD CONSTRAINT chk_email_subscriptions_reminder_locale
      CHECK (reminder_locale IS NULL OR reminder_locale IN ('en', 'pt-BR', 'es'));
  END IF;
END;
$$;

-- The daily claim scans opted-in reminder rows only.
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_reminder_opt_in
  ON email_subscriptions (reminder_opt_in) WHERE reminder_opt_in = true;

-- ── 2. email_reminder_log — per (user, kind, day) send ledger ────────────────
CREATE TABLE IF NOT EXISTS email_reminder_log (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Reminder family. Extensible (streak nudges, re-engagement) without a new
  -- ledger; each family gets its own once-per-day slot.
  kind    TEXT NOT NULL,
  -- America/Sao_Paulo calendar day the reminder was claimed for.
  sent_on DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, sent_on),
  CONSTRAINT chk_email_reminder_log_kind CHECK (kind IN ('session_plan'))
);

-- Service-role-only bookkeeping: RLS on, NO policies ⇒ anon/authenticated are
-- denied every operation. service_role bypasses RLS and is the only writer.
ALTER TABLE email_reminder_log ENABLE ROW LEVEL SECURITY;

-- ── 3. set_reminder_opt_in — self-service toggle (authenticated) ─────────────
-- Upserts ONLY the reminder columns of the caller's row, stamping the timestamp
-- server-side. Keyed on auth.uid(): a caller can only change their OWN consent.
-- Marketing consent on the same row is left completely untouched.
CREATE OR REPLACE FUNCTION set_reminder_opt_in(p_opt_in BOOLEAN, p_locale TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  -- Reject an unknown locale rather than store it: the CHECK would abort the
  -- whole toggle, and a bad locale is not worth failing a consent write over.
  v_locale TEXT := CASE WHEN p_locale IN ('en', 'pt-BR', 'es') THEN p_locale ELSE NULL END;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.email_subscriptions (
    user_id, reminder_opt_in, reminder_consent_at, reminder_unsubscribed_at,
    reminder_locale, updated_at
  )
  VALUES (
    v_uid,
    p_opt_in,
    CASE WHEN p_opt_in THEN now() ELSE NULL END,
    CASE WHEN p_opt_in THEN NULL ELSE now() END,
    v_locale,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    reminder_opt_in          = EXCLUDED.reminder_opt_in,
    -- A re-opt-in is FRESH consent (mirrors set_marketing_opt_in).
    reminder_consent_at      = CASE WHEN EXCLUDED.reminder_opt_in
                                    THEN now()
                                    ELSE public.email_subscriptions.reminder_consent_at END,
    reminder_unsubscribed_at = CASE WHEN EXCLUDED.reminder_opt_in
                                    THEN public.email_subscriptions.reminder_unsubscribed_at
                                    ELSE now() END,
    -- Keep the last known locale when the caller passes none.
    reminder_locale          = COALESCE(EXCLUDED.reminder_locale, public.email_subscriptions.reminder_locale),
    updated_at               = now();
END;
$$;

REVOKE ALL ON FUNCTION set_reminder_opt_in(BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_reminder_opt_in(BOOLEAN, TEXT) TO authenticated;

-- ── 4. claim_due_session_reminders — atomic claim + recipient read ───────────
-- THE consent gate AND the idempotency gate in one statement. Returns a learner
-- iff ALL of these hold:
--   * reminder_opt_in = true                      (explicit consent for THIS purpose)
--   * a real email on file                        (never a wallet-auth placeholder)
--   * prefs.nextLesson.day = today's São Paulo weekday   (they planned TODAY)
--   * no email_reminder_log row for (user, 'session_plan', today) — and the claim
--     row is INSERTed in the same statement, so a concurrent/second run gets
--     nothing back.
-- p_weekday overrides today's weekday (service_role only; used by tests and by a
-- manual catch-up run).
CREATE OR REPLACE FUNCTION claim_due_session_reminders(p_weekday TEXT DEFAULT NULL)
RETURNS TABLE (user_id UUID, email TEXT, unsubscribe_token UUID, locale TEXT, plan_time TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_column
DECLARE
  v_today   DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  -- to_char(..., 'dy') is the lowercase English abbreviation (mon…sun) — exactly
  -- the token the plan picker stores in prefs.nextLesson.day. No TM prefix, so
  -- it is NOT affected by the server's lc_time.
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
      es.unsubscribe_token                           AS tok,
      es.reminder_locale                             AS loc,
      COALESCE(p.prefs -> 'nextLesson' ->> 'time', '') AS ptime
    FROM public.email_subscriptions es
    JOIN auth.users u ON u.id = es.user_id
    JOIN public.profiles p ON p.id = es.user_id
    WHERE es.reminder_opt_in = true
      AND u.email IS NOT NULL
      AND u.email <> ''
      -- Synthetic wallet-auth addresses are not inboxes (see #779).
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
  -- Deterministic order so the pipeline's chunk boundaries (and therefore its
  -- Resend idempotency keys) are reproducible across a retry — same reasoning as
  -- list_marketing_recipients.
  ORDER BY d.uid;
END;
$$;

REVOKE ALL ON FUNCTION claim_due_session_reminders(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_due_session_reminders(TEXT) TO service_role;

-- ── 5. release_session_reminder_claims — undo a failed batch (service_role) ──
-- Deletes TODAY's claim rows for the given users so a failed send can be retried
-- within the same day. Only ever removes rows the pipeline itself just wrote.
CREATE OR REPLACE FUNCTION release_session_reminder_claims(p_user_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today   DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.email_reminder_log
  WHERE kind = 'session_plan'
    AND sent_on = v_today
    AND user_id = ANY(p_user_ids);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION release_session_reminder_claims(UUID[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION release_session_reminder_claims(UUID[]) TO service_role;

-- ── 6. unsubscribe_reminders_by_token — one-click (service_role) ─────────────
-- Clears REMINDER consent for the row owning `p_token`, with no session. Leaves
-- marketing consent untouched: unsubscribing from study reminders must not also
-- silently cancel product news (and vice versa). Idempotent.
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
  WHERE unsubscribe_token = p_token;
  GET DIAGNOSTICS v_matched = ROW_COUNT;
  RETURN v_matched > 0;
END;
$$;

REVOKE ALL ON FUNCTION unsubscribe_reminders_by_token(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION unsubscribe_reminders_by_token(UUID) TO service_role;

COMMIT;

-- ============================================================================
-- ROLLBACK (tested; not executed by the migration runner)
-- ----------------------------------------------------------------------------
-- BEGIN;
--   DROP FUNCTION IF EXISTS unsubscribe_reminders_by_token(UUID);
--   DROP FUNCTION IF EXISTS release_session_reminder_claims(UUID[]);
--   DROP FUNCTION IF EXISTS claim_due_session_reminders(TEXT);
--   DROP FUNCTION IF EXISTS set_reminder_opt_in(BOOLEAN, TEXT);
--   DROP TABLE IF EXISTS email_reminder_log;
--   ALTER TABLE email_subscriptions
--     DROP CONSTRAINT IF EXISTS chk_email_subscriptions_reminder_locale,
--     DROP COLUMN IF EXISTS reminder_locale,
--     DROP COLUMN IF EXISTS reminder_unsubscribed_at,
--     DROP COLUMN IF EXISTS reminder_consent_at,
--     DROP COLUMN IF EXISTS reminder_opt_in;
-- COMMIT;
-- ============================================================================
