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
-- COMING BACK: with the email and identities gone, the same person can sign up again
-- and gets a new account. The owner hasn't decided this. Refusing them would take a
-- stored hash of the identity, checked at the three sign-in routes.
--
-- Files: the avatar lives in Storage, which refuses SQL deletes, so the route
-- removes it through the API first.
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
  v_now       TIMESTAMPTZ := now();
  v_wallets   TEXT[];
  v_auth_table TEXT;
BEGIN
  -- The profile write locks accept only service_role. set_config rather than SET
  -- ROLE, which a SECURITY DEFINER function may not run; reverts at transaction end.
  PERFORM pg_catalog.set_config(
    'request.jwt.claims', '{"role":"service_role"}', true
  );

  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'delete_account_data: profile not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Every wallet this account held, including what an account deleted before this
  -- function existed still shows only in its placeholder email or spend history. A
  -- wallet a different live account holds now is theirs, as with a merged shell.
  -- user_metadata is not a source: the user can write to it.
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
    SELECT split_part(u.email::text, '@', 1) FROM auth.users u
     WHERE u.id = p_user_id
       AND lower(u.email::text) LIKE '%@wallet.superteam-lms.local'
       AND u.email::text NOT LIKE 'deleted-%'
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
  UPDATE public.profiles SET
    username = 'deleted-user-' || substr(md5(p_user_id::text), 1, 12),
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

  FOREACH v_auth_table IN ARRAY ARRAY[
    'identities', 'sessions', 'one_time_tokens', 'flow_state', 'mfa_factors',
    'mfa_recovery_code_sets', 'webauthn_credentials', 'webauthn_challenges',
    'oauth_consents', 'oauth_authorizations'
  ] LOOP
    -- Newer GoTrue tables may not exist everywhere; skip one that's absent rather
    -- than fail every deletion.
    IF to_regclass('auth.' || v_auth_table) IS NOT NULL THEN
      EXECUTE format('DELETE FROM auth.%I WHERE user_id = $1', v_auth_table)
        USING p_user_id;
    END IF;
  END LOOP;

  DELETE FROM auth.refresh_tokens WHERE user_id = p_user_id::text;
  DELETE FROM auth.audit_log_entries WHERE payload ->> 'actor_id' = p_user_id::text;
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

COMMIT;
