-- Linked X account on profiles.
--
-- A learner connects X from Settings › Profile through Supabase's `x` OAuth
-- provider (linkIdentity). The handle is then shown on their public profile and
-- next to their name on the courses they teach, so it has to be the account
-- they proved they own, not a string they typed: the old free-text
-- `social_links.twitter` stays in the JSON but is no longer read.
--
-- `x_id` is X's numeric user id (the identity's `sub`), unique like google_id
-- and github_id. `x_username` is the handle at link time; X lets people rename,
-- and reconnecting refreshes it. Both are written only by POST/DELETE
-- /api/profile/x with the service role, after the server has read the X
-- identity off the session, so a self-write would forge exactly the proof the
-- columns exist to carry.
--
-- A separate guard trigger, as with deleted_at (#1103) and the bookkeeping
-- columns: replacing enforce_profile_wallet_write's body can never drop these
-- guards, and this one can never drop its.
--
-- public_profiles gains `x_username` (appended, as CREATE OR REPLACE VIEW
-- requires). `x_id` stays off the view.
--
-- delete_account_data is replaced to scrub both columns. The body is otherwise
-- unchanged from 20261108140000_xp_account_funding_slot.sql.
--
-- Additive and idempotent. No data change on apply.

BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS x_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS x_username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_x_id_key ON public.profiles (x_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conname = 'chk_profiles_x_account'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    -- Both or neither, and a handle X itself would accept, so the value can be
    -- put into an x.com URL without escaping.
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_x_account CHECK (
        (x_id IS NULL AND x_username IS NULL)
        OR (
          x_id IS NOT NULL
          AND x_username IS NOT NULL
          AND x_username ~ '^[A-Za-z0-9_]{1,15}$'
        )
      );
  END IF;
END
$$;

COMMENT ON COLUMN public.profiles.x_id IS
  'X user id of the linked X account (the x identity''s sub). service_role writes only, via /api/profile/x.';
COMMENT ON COLUMN public.profiles.x_username IS
  'Handle of the linked X account at link time. Public via public_profiles. service_role writes only, via /api/profile/x.';

CREATE OR REPLACE FUNCTION public.enforce_profile_x_account_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  jwt_role TEXT;
  is_privileged BOOLEAN;
BEGIN
  jwt_role := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  is_privileged := COALESCE(current_user = 'service_role' OR jwt_role = 'service_role', false);

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.x_id IS DISTINCT FROM OLD.x_id THEN
      RAISE EXCEPTION
        'permission denied: x_id may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.x_username IS DISTINCT FROM OLD.x_username THEN
      RAISE EXCEPTION
        'permission denied: x_username may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.x_id := NULL;
    NEW.x_username := NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_profile_x_account_write() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_profile_x_account_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_x_account_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_x_account_write();

-- Same columns, order and filters as 20260910120000_verified_kind.sql, plus
-- x_username at the end.
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  p.wallet_address,
  p.username,
  p.avatar_url,
  p.bio,
  p.social_links,
  p.id,
  p.created_at,
  p.display_name,
  p.verified,
  p.verified_kind,
  p.x_username
FROM public.profiles p
WHERE p.is_public = true
  AND p.deleted_at IS NULL;

REVOKE ALL ON public.public_profiles FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.delete_account_data(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now        TIMESTAMPTZ := now();
  v_wallets    TEXT[];
  v_email      TEXT;
  v_username   TEXT;
  v_deleted_at TIMESTAMPTZ;
  v_candidate  TEXT;
  v_auth_table TEXT;
BEGIN
  -- The profile write locks accept only service_role. set_config rather than SET
  -- ROLE, which a SECURITY DEFINER function may not run; reverts at transaction end.
  PERFORM pg_catalog.set_config(
    'request.jwt.claims', '{"role":"service_role"}', true
  );

  SELECT p.username, p.deleted_at INTO v_username, v_deleted_at
  FROM public.profiles p WHERE p.id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'delete_account_data: profile not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  SELECT u.email::text INTO v_email FROM auth.users u WHERE u.id = p_user_id;

  -- Every wallet this account held, including what an account deleted before this
  -- function existed still shows only in its auth row or spend history. GoTrue
  -- lowercases emails, so a placeholder can't give back a base58 wallet: the real
  -- case is in user_metadata, written at sign-up. The user can edit metadata too, so
  -- it counts only when it matches the placeholder the server assigned. A wallet a
  -- different live account holds now is theirs, as with a merged shell.
  SELECT COALESCE(array_agg(DISTINCT held.wallet), ARRAY[]::text[])
    INTO v_wallets
  FROM (
    SELECT p.wallet_address AS wallet FROM public.profiles p WHERE p.id = p_user_id
    UNION ALL
    SELECT e.wallet_address FROM public.enrollments e WHERE e.user_id = p_user_id
    UNION ALL
    SELECT s.wallet FROM public.platform_spend s
     WHERE s.user_id = p_user_id AND s.wallet NOT LIKE 'deleted:%'
    UNION ALL
    SELECT u.raw_user_meta_data ->> 'wallet_address' FROM auth.users u
     WHERE u.id = p_user_id
       AND lower(u.email::text) = lower(u.raw_user_meta_data ->> 'wallet_address')
                                  || '@wallet.superteam-lms.local'
  ) held
  WHERE held.wallet IS NOT NULL
    AND held.wallet <> ''
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles other
      WHERE other.wallet_address = held.wallet AND other.id <> p_user_id
    );

  -- ── credential metadata: before the profile, while certificates still link it ──
  UPDATE public.nft_metadata m
  SET data = jsonb_set(
    m.data,
    '{attributes}',
    (
      SELECT jsonb_agg(
        CASE WHEN attr.value ->> 'trait_type' = 'Recipient'
          THEN jsonb_build_object('trait_type', 'Recipient', 'value', 'Deleted user')
          ELSE attr.value
        END
        ORDER BY attr.ordinality
      )
      FROM jsonb_array_elements(m.data -> 'attributes') WITH ORDINALITY AS attr(value, ordinality)
    )
  )
  WHERE jsonb_typeof(m.data -> 'attributes') = 'array'
    AND (
      m.id IN (
        SELECT substring(c.metadata_uri FROM 'id=([0-9a-fA-F-]{36})')::uuid
        FROM public.certificates c
        WHERE c.user_id = p_user_id AND c.metadata_uri ~ 'id=[0-9a-fA-F-]{36}'
      )
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(m.data -> 'attributes') attr
        WHERE attr ->> 'trait_type' = 'Recipient'
          AND attr ->> 'value' = ANY(v_wallets)
      )
    );

  -- ── profiles ─────────────────────────────────────────────────────────────────
  -- A tombstone keeps the name it already has, so a re-run changes nothing.
  IF v_deleted_at IS NULL OR v_username NOT LIKE 'deleted-user-%' THEN
    v_username := NULL;
    FOR i IN 1..5 LOOP
      v_candidate := 'deleted-user-' || substr(md5(gen_random_uuid()::text), 1, 12);
      IF NOT EXISTS (SELECT 1 FROM public.profiles o WHERE o.username = v_candidate) THEN
        v_username := v_candidate;
        EXIT;
      END IF;
    END LOOP;
    IF v_username IS NULL THEN
      RAISE EXCEPTION 'delete_account_data: no free tombstone name';
    END IF;
  END IF;

  UPDATE public.profiles SET
    username = v_username,
    display_name = NULL,
    bio = NULL,
    avatar_url = NULL,
    social_links = NULL,
    wallet_address = NULL,
    wallet_kind = NULL,
    wallet_xp_synced_at = NULL,
    google_id = NULL,
    github_id = NULL,
    x_id = NULL,
    x_username = NULL,
    is_public = false,
    verified_kind = NULL,
    verified = false,
    segment = NULL,
    goal = NULL,
    daily_goal = NULL,
    prefs = '{}'::jsonb,
    referral_code = NULL,
    referred_by = NULL,
    deleted_at = COALESCE(deleted_at, v_now),
    deletion_requested_at = COALESCE(deletion_requested_at, v_now)
  WHERE id = p_user_id;

  -- ── mail: consent ends, an earlier opt-out keeps its date ──────────────────────
  UPDATE public.email_subscriptions es SET
    opt_in = false,
    reminder_opt_in = false,
    reminder_locale = NULL,
    unsubscribed_at = CASE WHEN es.opt_in THEN v_now ELSE es.unsubscribed_at END,
    reminder_unsubscribed_at = CASE WHEN es.reminder_opt_in THEN v_now ELSE es.reminder_unsubscribed_at END,
    updated_at = v_now
  WHERE es.user_id = p_user_id;

  -- ── delete ───────────────────────────────────────────────────────────────────
  DELETE FROM public.email_reminder_log WHERE user_id = p_user_id;
  DELETE FROM public.review_items WHERE user_id = p_user_id;
  DELETE FROM public.streak_freezes_used WHERE user_id = p_user_id;
  DELETE FROM public.thread_views WHERE user_id = p_user_id;
  DELETE FROM public.deployed_programs WHERE user_id = p_user_id;
  DELETE FROM public.admin_users WHERE user_id = p_user_id;
  DELETE FROM public.ai_spend_ledger
    WHERE scope = 'account' AND scope_key = p_user_id::text;
  DELETE FROM public.rate_limits WHERE key LIKE '%:' || p_user_id::text;

  -- ── scrub ────────────────────────────────────────────────────────────────────
  UPDATE public.enrollments SET wallet_address = NULL WHERE user_id = p_user_id;

  UPDATE public.challenge_assists SET chat_log = '[]'::jsonb WHERE user_id = p_user_id;

  UPDATE public.flags SET details = NULL WHERE reporter_id = p_user_id;

  -- Nothing can be delivered to an account with no wallet. Resolving stops the
  -- drains re-claiming the row forever; the unique key on the row stays.
  UPDATE public.pending_onchain_actions SET
    payload = '{}'::jsonb,
    last_error = NULL,
    resolved_at = COALESCE(resolved_at, v_now)
  WHERE user_id = p_user_id;

  UPDATE public.siws_nonces SET wallet_address = NULL, ip_address = NULL
  WHERE wallet_address = ANY(v_wallets);

  -- Sponsored and XP token account funding rows must keep a key: a CHECK requires
  -- it and the once-per-wallet indexes are built on it. A one-way hash keeps the
  -- rule without keeping the wallet; lib/platform-spend/wallet-keys.ts computes the
  -- same value to find it.
  UPDATE public.platform_spend SET wallet = CASE
    WHEN action IN ('enroll_sponsor', 'enroll_sponsor_reenroll', 'xp_account_fund')
      THEN 'deleted:' || encode(sha256(convert_to(wallet, 'UTF8')), 'hex')
    ELSE NULL
  END
  WHERE wallet = ANY(v_wallets);

  -- ── auth ─────────────────────────────────────────────────────────────────────
  UPDATE auth.users SET
    email = 'deleted-' || p_user_id::text || '@wallet.superteam-lms.local',
    phone = NULL,
    encrypted_password = NULL,
    email_change = '',
    phone_change = '',
    confirmation_token = '',
    recovery_token = '',
    email_change_token_current = '',
    email_change_token_new = '',
    phone_change_token = '',
    reauthentication_token = '',
    raw_user_meta_data = '{}'::jsonb,
    raw_app_meta_data = '{}'::jsonb,
    last_sign_in_at = NULL,
    banned_until = v_now + interval '876600 hours',
    deleted_at = COALESCE(deleted_at, v_now),
    updated_at = v_now
  WHERE id = p_user_id;

  -- Every auth table keyed on the account, so one GoTrue adds later is covered. Only
  -- tables this role can delete from: a new one must not fail every deletion.
  FOR v_auth_table IN
    SELECT c.relname
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
    WHERE n.nspname = 'auth'
      AND c.relkind = 'r'
      AND c.relname <> 'users'
      AND a.attname = 'user_id'
      AND a.atttypid = 'uuid'::regtype
      AND NOT a.attisdropped
      AND has_table_privilege(c.oid, 'DELETE')
  LOOP
    EXECUTE format('DELETE FROM auth.%I WHERE user_id = $1', v_auth_table)
      USING p_user_id;
  END LOOP;

  DELETE FROM auth.refresh_tokens WHERE user_id = p_user_id::text;

  -- The person is the actor on their own events. Admin API rows have a nil actor and
  -- name them in traits, by id or by email.
  DELETE FROM auth.audit_log_entries a
  WHERE a.payload ->> 'actor_id' = p_user_id::text
     OR a.payload -> 'traits' ->> 'user_id' = p_user_id::text
     OR a.payload -> 'traits' ->> 'user_email' = v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_account_data(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account_data(UUID) TO service_role;

COMMIT;
