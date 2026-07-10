-- ============================================
-- SP1: retire teacher-role machinery; lock profiles.wallet_address writes
-- to service_role (closes #408)
-- ============================================
-- SP1 retires the teacher-role concept: instructor identity moves to the
-- on-curve `instructor.wallet` field in academy-courses, so `profiles.role`
-- (added in migration 20260703130652 for issue #263) is no longer read by
-- any RLS policy or app gate once the teacher-authoring UI is repointed at
-- the new identity source (tracked separately; see PR body / apply-gate
-- note below — do NOT apply this file until that repoint has shipped).
--
-- IRREVERSIBLE BY DESIGN: dropping the column destroys every existing
-- 'teacher'/'admin' role value. Take the snapshot in the PR body
-- (`SELECT id, role FROM public.profiles WHERE role IS DISTINCT FROM
-- 'learner';`) before applying.
--
-- Live-verified 2026-07-10: zero RLS policies reference profiles.role (the
-- self-service policies on profiles gate on `auth.uid() = id` only; the
-- role column was read exclusively from application code, not from RLS).
--
-- #408 — same escalation class, new column. profiles carries self-service
-- RLS policies so a user can write their OWN row:
--   FOR INSERT WITH CHECK (auth.uid() = id)
--   FOR UPDATE USING      (auth.uid() = id)
-- Those policies do not constrain WHICH columns are written. Without a
-- guard, any authenticated user could overwrite wallet_address on their own
-- row via a PostgREST INSERT/UPDATE (RLS only checks the row id) — either
-- clobbering their own linked wallet or, if a profile row existed without a
-- wallet yet, squatting a wallet address that isn't theirs before the real
-- owner links it.
--
-- Investigated write paths (2026-07-10): profiles.wallet_address is
-- currently written ONLY via UPDATE, and ONLY from service-role clients:
--   * apps/web/src/app/api/auth/wallet/route.ts       (SIWS sign-in / first
--     wallet link — raw createClient() with SUPABASE_SERVICE_ROLE_KEY)
--   * apps/web/src/app/api/auth/link-wallet/route.ts  (linking a wallet to
--     an existing OAuth account — createAdminClient())
-- The auto-provisioning trigger (handle_new_user(), see below) that INSERTs
-- the profiles row on signup never sets wallet_address — it only sets id,
-- username, avatar_url — so wallet_address is always NULL at row creation
-- and only ever populated afterward by the two service-role UPDATE paths
-- above. There is no legitimate non-privileged path that sets
-- wallet_address on INSERT today.
--
-- Fix: a BEFORE INSERT OR UPDATE trigger makes wallet_address writable only
-- by service_role, mirroring enforce_profile_role_write() exactly:
--   * UPDATE: a non-privileged caller changing wallet_address -> RAISE
--     EXCEPTION.
--   * INSERT: a non-privileged caller's wallet_address is silently coerced
--     to NULL. This is defense-in-depth rather than a live threat today
--     (handle_new_user() already creates the row with wallet_address NULL
--     before any client-side call is possible, so a client INSERT would
--     normally just fail on the primary key) — it guards against a future
--     change to the provisioning path (or a direct-table write bypassing
--     it) being able to squat a victim's wallet address pre-emptively.
--
-- service_role detection is the identical belt-and-suspenders check as the
-- role trigger: PostgREST runs requests under the `authenticated`/`anon`
-- role and stashes JWT claims in `request.jwt.claims`, while a direct
-- service-role connection runs as `current_user = 'service_role'`. Either
-- signal is sufficient.
--
-- The trigger function is SECURITY INVOKER: it must observe the CALLER's
-- role, not the definer's. (A SECURITY DEFINER function would see the
-- owner's role and defeat the check.)
--
-- Idempotent: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS / CREATE;
-- DROP TRIGGER/FUNCTION/CONSTRAINT/COLUMN all IF EXISTS.

-- ─────────────────────────────────────────────
-- (a) Drop teacher-role machinery
-- ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_enforce_profile_role_write ON public.profiles;
DROP FUNCTION IF EXISTS public.enforce_profile_role_write();

-- Explicit-safe: DROP COLUMN removes its own CHECK constraint automatically,
-- but drop it by name first so intent is unambiguous even if the column
-- drop below is ever split out.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_role;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- ─────────────────────────────────────────────
-- (b) #408 — lock profiles.wallet_address writes to service_role
-- ─────────────────────────────────────────────
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
  ELSIF TG_OP = 'INSERT' THEN
    -- Non-privileged caller may never set wallet_address on creation; the
    -- signup path never sets it either (handle_new_user() omits it), so
    -- coercing to NULL cannot break ordinary profile creation and closes
    -- off a pre-emptive wallet-squat via direct INSERT.
    IF NEW.wallet_address IS NOT NULL THEN
      NEW.wallet_address := NULL;
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
