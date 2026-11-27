-- XP token account funding: once per wallet and XP mint.
--
-- The platform pays the rent of a learner's Token-2022 XP token account when it
-- first creates it. That create is now its own transaction, recorded in
-- platform_spend as action `xp_account_fund`, and a wallet gets at most one per
-- XP mint on a cluster. A pending (in flight) or confirmed row holds the slot; a
-- failed, expired or superseded one frees it, and a superseded one that landed
-- (`superseded_landed`) counts as used in the app, as for sponsored enrollments.
-- A later create for the same wallet and mint is left to the learner.
--
-- `token_mint` is the slot's mint. Only `xp_account_fund` rows set it, and they
-- must, along with the wallet: a NULL in the index key would make every row
-- distinct.
--
-- delete_account_data is replaced to keep `xp_account_fund` rows keyed after an
-- account is deleted, with the same one-way wallet hash sponsored enrollments
-- use. Without it the CHECK below would also make deletion fail for any account
-- with such a row. The function body is otherwise unchanged from
-- 20261105130000_delete_account_data.sql.
--
-- Additive and idempotent. No data change on apply.

BEGIN;

ALTER TABLE public.platform_spend ADD COLUMN IF NOT EXISTS token_mint TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conname = 'platform_spend_xp_account_fund_keys_check'
      AND conrelid = 'public.platform_spend'::regclass
  ) THEN
    ALTER TABLE public.platform_spend
      ADD CONSTRAINT platform_spend_xp_account_fund_keys_check
      CHECK (
        action <> 'xp_account_fund'
        OR (wallet IS NOT NULL AND token_mint IS NOT NULL)
      );
  END IF;
END
$$;

-- At most one live XP token account funding per cluster, mint and wallet.
CREATE UNIQUE INDEX IF NOT EXISTS platform_spend_xp_account_fund_once
  ON public.platform_spend (cluster, token_mint, wallet)
  WHERE action = 'xp_account_fund'
    AND status IN ('pending', 'confirmed');

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
