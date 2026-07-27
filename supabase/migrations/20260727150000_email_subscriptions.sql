-- ============================================================================
-- Migration: email_subscriptions — marketing-email consent model (#769)
--
-- Superteam Academy has no email provider and no consent model. Before ANY
-- marketing/announcement mail can be sent (new-course announcements, product
-- news), we need a per-user opt-in that DEFAULTS TO OPT-OUT and is honored on
-- every send. Team is Brazil-based → LGPD applies (also GDPR/CAN-SPAM): consent
-- must be explicit, recorded with a timestamp, and one-click-revocable.
--
-- WHY A DEDICATED TABLE (not a profiles column). `profiles` carries the public
-- profile + self-writable prefs and feeds `public_profiles`; keeping the consent
-- flag + the SECRET unsubscribe token off that table avoids any risk of leaking
-- either through the public view, and gives this data its own tight RLS. One row
-- per user, created lazily on first opt-in.
--
-- SECURITY MODEL:
--   * RLS on. Own-row SELECT only (a learner reads their OWN subscription state
--     for the settings toggle). anon gets no read. NO write policy — writes go
--     through SECURITY DEFINER RPCs so the consent TIMESTAMPS are server-
--     authoritative (a client can't backdate consent).
--   * set_marketing_opt_in(boolean) — SELF-SERVICE, GRANTed to `authenticated`,
--     keyed on auth.uid(): the settings toggle. Stamps consent_at on opt-in and
--     unsubscribed_at on opt-out.
--   * list_marketing_recipients() — SERVICE_ROLE only: the send pipeline's
--     recipient read. Joins auth.users for the email (SECURITY DEFINER can read
--     the auth schema) and returns ONLY opted-in users WITH an email on file
--     (wallet-only SIWS users have none → never emailed). This is the single
--     consent gate the pipeline trusts.
--   * unsubscribe_by_token(uuid) — SERVICE_ROLE only: the one-click List-
--     Unsubscribe endpoint. Flips opt_in→false by the per-user token WITHOUT a
--     session (the email link carries no auth). Returns whether a row matched.
--
-- Every function is SECURITY DEFINER, search_path-pinned to '', REVOKEd from
-- PUBLIC/anon and GRANTed only to its intended role — the review_items /
-- challenge_assists house pattern.
--
-- Idempotent: CREATE TABLE/INDEX IF NOT EXISTS, CREATE OR REPLACE FUNCTION,
-- DROP POLICY IF EXISTS before CREATE POLICY. Explicit BEGIN/COMMIT. Tested
-- ROLLBACK at the bottom. Mirrored into supabase/schema.sql.
-- ============================================================================

BEGIN;

-- ── email_subscriptions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_subscriptions (
  user_id           UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  -- Marketing opt-in. DEFAULT FALSE — never email without an explicit opt-in.
  opt_in            BOOLEAN NOT NULL DEFAULT false,
  -- When the learner last opted IN / OUT (LGPD audit trail).
  consent_at        TIMESTAMPTZ,
  unsubscribed_at   TIMESTAMPTZ,
  -- Per-user secret for the unauthenticated one-click unsubscribe link. A random
  -- uuid so the link is unguessable; UNIQUE so a token maps to exactly one user.
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_subscriptions_token_unique UNIQUE (unsubscribe_token)
);

-- Send pipeline scans opted-in rows.
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_opt_in
  ON email_subscriptions (opt_in) WHERE opt_in = true;

ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Own-row read: the settings UI reads the learner's own opt-in state. No anon.
DROP POLICY IF EXISTS "Users can view their own email subscription" ON email_subscriptions;
CREATE POLICY "Users can view their own email subscription"
  ON email_subscriptions FOR SELECT USING (auth.uid() = user_id);
-- NO write policy: writes only via the SECURITY DEFINER RPCs below.

-- ── set_marketing_opt_in — self-service toggle (authenticated) ───────────────
-- Upserts the caller's row, stamping the consent/unsubscribe timestamp server-
-- side so it can't be forged. Keyed on auth.uid(): a caller can only ever change
-- their OWN subscription.
CREATE OR REPLACE FUNCTION set_marketing_opt_in(p_opt_in BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.email_subscriptions (user_id, opt_in, consent_at, unsubscribed_at, updated_at)
  VALUES (
    v_uid,
    p_opt_in,
    CASE WHEN p_opt_in THEN now() ELSE NULL END,
    CASE WHEN p_opt_in THEN NULL ELSE now() END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    opt_in          = EXCLUDED.opt_in,
    -- Keep the FIRST consent time on a re-opt-in only if already set? No — record
    -- the LATEST opt-in as the active consent (a re-subscribe is fresh consent).
    consent_at      = CASE WHEN EXCLUDED.opt_in THEN now() ELSE public.email_subscriptions.consent_at END,
    unsubscribed_at = CASE WHEN EXCLUDED.opt_in THEN public.email_subscriptions.unsubscribed_at ELSE now() END,
    updated_at      = now();
END;
$$;

REVOKE ALL ON FUNCTION set_marketing_opt_in(BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_marketing_opt_in(BOOLEAN) TO authenticated;

-- ── list_marketing_recipients — pipeline recipient read (service_role) ───────
-- The ONE consent gate the send pipeline trusts: opted-in users who have an
-- email on file. Reads auth.users (SECURITY DEFINER). Never returns wallet-only
-- users (no email).
CREATE OR REPLACE FUNCTION list_marketing_recipients()
RETURNS TABLE (user_id UUID, email TEXT, unsubscribe_token UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT es.user_id, u.email::text, es.unsubscribe_token
  FROM public.email_subscriptions es
  JOIN auth.users u ON u.id = es.user_id
  WHERE es.opt_in = true
    AND u.email IS NOT NULL
    AND u.email <> ''
  -- DETERMINISTIC ORDER (#779 review): the campaign chunks this list by array
  -- position and derives each batch's idempotency key from the chunk's member
  -- ids. A stable ORDER BY makes chunk boundaries reproducible across a partial-
  -- send retry, so an unchanged chunk keys identically (cached, never double-
  -- sent) and only a chunk whose membership actually shifted re-sends.
  ORDER BY es.user_id;
$$;

REVOKE ALL ON FUNCTION list_marketing_recipients() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION list_marketing_recipients() TO service_role;

-- ── unsubscribe_by_token — one-click List-Unsubscribe (service_role) ─────────
-- Flips opt_in→false for the row owning `p_token`, with no session (the email
-- link carries none). Returns true iff a row matched. Idempotent.
CREATE OR REPLACE FUNCTION unsubscribe_by_token(p_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_matched BOOLEAN;
BEGIN
  UPDATE public.email_subscriptions
  SET opt_in = false, unsubscribed_at = now(), updated_at = now()
  WHERE unsubscribe_token = p_token;
  GET DIAGNOSTICS v_matched = ROW_COUNT;
  RETURN v_matched > 0;
END;
$$;

REVOKE ALL ON FUNCTION unsubscribe_by_token(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION unsubscribe_by_token(UUID) TO service_role;

COMMIT;

-- ============================================================================
-- ROLLBACK (tested; not executed by the migration runner)
-- ----------------------------------------------------------------------------
-- BEGIN;
--   DROP FUNCTION IF EXISTS unsubscribe_by_token(UUID);
--   DROP FUNCTION IF EXISTS list_marketing_recipients();
--   DROP FUNCTION IF EXISTS set_marketing_opt_in(BOOLEAN);
--   DROP TABLE IF EXISTS email_subscriptions;
-- COMMIT;
-- ============================================================================
