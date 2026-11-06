-- Account deletion policy: anonymize, in one transaction.
--
-- delete_account_data applies a decision to every table holding user data.
-- apps/web/src/lib/account/deletion-policy.ts lists those decisions with their
-- reasons, and its test fails when a new table or person-pointing column has none.
--
-- auth.users VALUES CHANGE HERE (no structure changes). This mirrors what GoTrue's
-- own soft delete does (internal/models/user.go, SoftDeleteUser), inside this
-- transaction instead of a second call that could fail after the rest committed:
--   * email becomes deleted-<id>@wallet.superteam-lms.local, on the placeholder
--     domain every mail gate already refuses. The local part can't collide with a
--     real placeholder because a base58 pubkey has no hyphen.
--   * Token and change columns become '', never NULL: GoTrue scans them into plain
--     Go strings, and a NULL breaks every later read of the row.
--   * Identities are removed, so neither GoTrue nor find_user_by_oauth_identity can
--     resolve the old account. No admin endpoint does this.
--   * Sessions go and banned_until is set in this transaction, so there is no window
--     where the data is scrubbed and a session still refreshes. A failed call changes
--     nothing and the session survives, so the client can retry.
--
-- Once the email and identities are gone, signing in with the same identity creates
-- a new account.
--
-- Usernames: the tombstone name is random, because a name derived from the id could
-- be taken in advance. enforce_profile_tombstone_write keeps the prefix out of client
-- hands and stops an unexpired token writing to a tombstone.
--
-- Files: the avatar lives in Storage, which refuses SQL deletes. The route removes it
-- after this commits, and the account-retention cron finishes any it couldn't.
--
-- Idempotent: every statement is safe to repeat, and wallets now held by a live
-- account are never touched, so a re-run after someone came back can't reach them.

BEGIN;

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

  -- Sponsored rows must keep a key: a CHECK requires it and the once-per-wallet
  -- index is built on it. A one-way hash keeps the rule without keeping the wallet;
  -- lib/platform-spend/ledger.ts computes the same value to find it.
  UPDATE public.platform_spend SET wallet = CASE
    WHEN action IN ('enroll_sponsor', 'enroll_sponsor_reenroll')
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

-- IP rows hold no account id, so no per-account delete can find them. Only today's
-- row is ever read (check_ai_spend), so older ones are removed by age.
CREATE OR REPLACE FUNCTION public.purge_ai_spend_ip_rows(p_keep_days INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  IF p_keep_days IS NULL OR p_keep_days < 1 THEN
    RAISE EXCEPTION 'p_keep_days must be >= 1';
  END IF;
  DELETE FROM public.ai_spend_ledger
  WHERE scope = 'ip'
    AND spend_day < (now() AT TIME ZONE 'America/Sao_Paulo')::date - p_keep_days;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_ai_spend_ip_rows(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_ai_spend_ip_rows(INTEGER) TO service_role;

-- Accounts delete_account_data finished that still have an avatar file, for the
-- account-retention cron. auth.users.deleted_at marks the ones it finished.
CREATE OR REPLACE FUNCTION public.list_deleted_account_avatar_owners(p_limit INTEGER)
RETURNS SETOF UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'p_limit must be >= 1';
  END IF;
  RETURN QUERY
  SELECT DISTINCT u.id
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id AND p.deleted_at IS NOT NULL
  JOIN storage.objects o
    ON o.bucket_id = 'avatars' AND split_part(o.name, '/', 1) = u.id::text
  WHERE u.deleted_at IS NOT NULL
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.list_deleted_account_avatar_owners(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_deleted_account_avatar_owners(INTEGER) TO service_role;

-- Own-row RLS says which row a caller may write, not which values. Same privileged
-- test as enforce_profile_deleted_at_write, as its own trigger so the other locks'
-- bodies stay untouched. Stops an unexpired token writing to a tombstone, and keeps
-- the tombstone name prefix out of client hands. Only a change to the name is
-- refused, so a no-op update on an existing row passes.
CREATE OR REPLACE FUNCTION public.enforce_profile_tombstone_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  jwt_role TEXT;
BEGIN
  jwt_role := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  IF COALESCE(current_user = 'service_role' OR jwt_role = 'service_role', false) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'permission denied: a deleted account can''t be changed'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF lower(NEW.username) LIKE 'deleted-user-%'
     AND (TG_OP = 'INSERT' OR NEW.username IS DISTINCT FROM OLD.username) THEN
    RAISE EXCEPTION 'permission denied: this username is reserved'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_profile_tombstone_write() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_profile_tombstone_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_tombstone_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_tombstone_write();

COMMIT;
