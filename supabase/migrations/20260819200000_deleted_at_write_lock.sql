-- Lock profiles.deleted_at writes to service_role (#1103)
--
-- The self-service profiles RLS policies are column-agnostic —
--   FOR INSERT WITH CHECK (auth.uid() = id)
--   FOR UPDATE USING      (auth.uid() = id)
-- — so they say WHICH row a caller may write, never WHICH columns. deleted_at
-- is the account tombstone: /api/account/delete stamps it (service_role) and
-- every public read plus the login chokepoints key on `deleted_at IS NULL`.
-- Nothing stopped the tombstoned user from clearing it. A deleted account still
-- holding a valid access token could go straight to PostgREST with
--
--   UPDATE profiles SET deleted_at = NULL, is_public = true WHERE id = <self>
--
-- and resurrect itself permanently — the write survives long after the token
-- that authorised it expires. Since #1089 the middleware no longer re-checks
-- the tombstone per request, so the deletion route's session revocation is the
-- only thing bounding the window, and the window is enough: one write inside it
-- is permanent. Surfaced by the #1102 adversarial review (F5).
--
-- Fix: the same escalation-lockdown trigger already applied to wallet_address
-- (#408, 20260710120000) and to the referral columns (20260818150000) —
-- SECURITY INVOKER so `current_user` is the real caller, a
-- BEFORE row trigger so it runs ahead of the write, privileged =
-- `current_user = 'service_role'` (direct service-role connection) OR the
-- PostgREST `request.jwt.claims` role (service-role key routed through
-- PostgREST). Either signal is sufficient; nothing else is.
--
-- SEPARATE trigger rather than a third column in enforce_profile_wallet_write:
-- extending that function means CREATE OR REPLACE-ing its whole body, and
-- supabase/schema.sql's copy of it is stale (it predates #997's display_name /
-- verified locks, which are live on prod). Replacing prod's body from the
-- snapshot would silently revert two deployed guards. An additive trigger
-- cannot. This is also what the referral lock did.
--
--   UPDATE — a non-privileged caller changing deleted_at at all raises. Both
--     directions are blocked: clearing it is the resurrection above, and
--     setting it is not a self-service path either (deletion goes through
--     POST /api/account/delete, which also scrubs PII and revokes sessions —
--     a bare self-stamp would tombstone the row while leaving the session
--     alive and the PII in place).
--   INSERT — coerced to NULL rather than raised, matching the wallet lock: the
--     signup path (handle_new_user) inserts the profiles row itself and never
--     sets deleted_at, so coercion cannot break account creation, while a hard
--     failure there could.
--
-- The service-role writers are unaffected: /api/account/delete uses
-- createAdminClient(), and merge_wallet_shell_account() (which tombstones the
-- merged shell) already sets request.jwt.claims to the service_role claim at
-- the top of its body for the wallet lock — the identical check, so the same
-- set_config satisfies this one.
--
-- Idempotent: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS / CREATE.

CREATE OR REPLACE FUNCTION public.enforce_profile_deleted_at_write()
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
    -- IS DISTINCT FROM is NULL-safe and lets no-op updates through, so an
    -- ordinary profile edit (bio, username, is_public) is untouched.
    IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
      RAISE EXCEPTION
        'permission denied: deleted_at may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.deleted_at IS NOT NULL THEN
      NEW.deleted_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger functions run in trigger context (no EXECUTE needed), so this helper
-- must never be callable via PostgREST RPC. Revoke the default PUBLIC grant.
REVOKE EXECUTE ON FUNCTION public.enforce_profile_deleted_at_write() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_profile_deleted_at_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_deleted_at_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_deleted_at_write();
