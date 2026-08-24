-- profiles.wallet_kind — how the account's linked wallet was provisioned.
--
-- WHY A COLUMN AND NOT A DERIVED SIGNAL
--
-- A learner who signed in through Dynamic holds an EMBEDDED wallet that
-- wallet-adapter knows nothing about. When the Dynamic JWT expires (we run
-- JWT mode, which does not auto-refresh) the browser has no way to tell
-- "embedded wallet, dead session" apart from "no wallet at all" — a reload
-- restores nothing and emits no logout event. The two need opposite answers:
-- the first must offer Dynamic re-auth, the second the wallet-connect modal.
-- Showing the connect modal to an embedded-wallet learner is a dead end (they
-- have no extension to connect), which is the bug this column closes.
--
-- NULL = unknown/legacy. Callers must treat NULL as "not known to be
-- embedded" and keep the pre-existing behaviour, so this is additive: no row
-- changes meaning until it is written or backfilled. The backfill is a
-- SEPARATE operator step — see 20260824120000_wallet_kind.sql.backfill.
--
-- Writers (all service_role, via createAdminClient):
--   /api/auth/dynamic     → 'embedded', only for a profile with no wallet yet
--   /api/auth/wallet      → client-declared kind, only when still NULL
--   /api/auth/link-wallet → client-declared kind, only when still NULL
--   /api/account/delete   → NULL (part of the #410 anonymisation)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_kind TEXT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_profiles_wallet_kind;

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_wallet_kind
  CHECK (wallet_kind IS NULL OR wallet_kind IN ('embedded', 'external'));

COMMENT ON COLUMN public.profiles.wallet_kind IS
  'How the linked wallet was provisioned: embedded (Dynamic WaaS) or external (wallet-adapter). NULL = unknown/legacy — callers must fall back to the external-wallet behaviour.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Write lock: wallet_kind rides with wallet_address, not with prefs.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- The self-service profiles RLS policies (auth.uid() = id) do not constrain
-- WHICH columns an authenticated user writes, which is why wallet_address has
-- carried enforce_profile_wallet_write since #408/#696. wallet_kind describes
-- that same wallet identity and decides which re-auth path the app offers, so
-- leaving it self-writable would hand any learner a switch on their own auth
-- recovery flow. It is only ever set by the service-role routes listed above,
-- so locking it cannot break a legitimate write.
--
-- The function is REPLACED, not duplicated: same name, same trigger, same
-- SECURITY INVOKER + pinned search_path contract as 20260710120000. Only the
-- guarded column set grows.
--
-- DELIBERATE EXCEPTION to the one-guard-per-concern convention that
-- 20260819200000 (deleted_at) argues for. That separation exists so replacing
-- one function's body cannot silently revert an UNRELATED guard. wallet_kind
-- is not unrelated — it is meaningless without wallet_address and is always
-- written in the same request — so a separate trigger would create two
-- functions that must be edited together, which is the failure mode the
-- convention is trying to avoid.

CREATE OR REPLACE FUNCTION public.enforce_profile_wallet_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  jwt_role TEXT;
  is_privileged BOOLEAN;
BEGIN
  -- Effective DB role (direct service-role connection) OR the PostgREST JWT
  -- claims role (service-role key routed through PostgREST). Either implies
  -- privileged. current_setting(..., true) returns NULL (not an error) when
  -- the GUC is unset, e.g. a direct psql session with no JWT context;
  -- NULLIF guards against an empty-string GUC (''::jsonb would raise).
  -- COALESCE keeps the result a strict boolean so the IF below never sees
  -- NULL.
  jwt_role := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  is_privileged := COALESCE(current_user = 'service_role' OR jwt_role = 'service_role', false);

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Non-privileged caller may not change wallet_address at all.
    -- IS DISTINCT FROM is NULL-safe and lets no-op updates through.
    IF NEW.wallet_address IS DISTINCT FROM OLD.wallet_address THEN
      RAISE EXCEPTION
        'permission denied: wallet_address may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.wallet_kind IS DISTINCT FROM OLD.wallet_kind THEN
      RAISE EXCEPTION
        'permission denied: wallet_kind may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- Non-privileged caller may never set wallet_address on creation; the
    -- signup path never sets it either (handle_new_user() omits it), so
    -- coercing to NULL cannot break ordinary profile creation and closes
    -- off a pre-emptive wallet-squat via direct INSERT.
    IF NEW.wallet_address IS NOT NULL THEN
      NEW.wallet_address := NULL;
    END IF;
    IF NEW.wallet_kind IS NOT NULL THEN
      NEW.wallet_kind := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_wallet_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_wallet_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_wallet_write();

-- Trigger functions run in trigger context (no EXECUTE needed), so this
-- helper must never be callable via PostgREST RPC. Revoke the default
-- PUBLIC grant.
REVOKE EXECUTE ON FUNCTION public.enforce_profile_wallet_write() FROM PUBLIC, anon, authenticated;
