-- ============================================
-- Teacher role: add profiles.role + lock role writes to service_role
-- (issue #263 — foundation for teacher-authored courses)
-- ============================================
-- Adds a coarse role to profiles ('learner' | 'teacher' | 'admin') so the app
-- can gate teacher authoring + admin approval flows. Existing rows default to
-- 'learner'.
--
-- CRITICAL SECURITY — privilege-escalation lockdown.
-- profiles carries self-service RLS policies so a user can edit their OWN row:
--   FOR INSERT WITH CHECK (auth.uid() = id)
--   FOR UPDATE USING      (auth.uid() = id)
-- Those policies do NOT constrain WHICH columns are written. Without the guard
-- below, any authenticated user could escalate themselves by writing
-- role = 'teacher' / 'admin' straight to their own row via a PostgREST
-- INSERT/UPDATE (RLS would happily allow it — it only checks the row id).
--
-- Fix: a BEFORE INSERT OR UPDATE trigger makes `role` writable ONLY by
-- service_role. All legitimate role changes go through the admin API (#264),
-- which uses the service-role key via createAdminClient() and so is detected as
-- privileged and passes through untouched.
--   * UPDATE: a non-privileged caller changing role -> RAISE EXCEPTION.
--   * INSERT: a non-privileged caller is silently coerced back to 'learner'
--     (so ordinary profile creation on signup still succeeds — the signup path
--     never sets role, and even a crafted role is quietly downgraded rather
--     than erroring the whole insert).
--
-- service_role detection is deliberately belt-and-suspenders: PostgREST runs
-- requests under the `authenticated`/`anon` role and stashes the JWT claims in
-- `request.jwt.claims`, while a direct service-role connection runs as
-- `current_user = 'service_role'`. We treat the caller as privileged when
-- EITHER signal says service_role, so the check holds whether the write comes
-- via PostgREST with a service-role JWT or a direct service-role DB session.
--
-- The trigger function is SECURITY INVOKER: it must observe the CALLER's role,
-- not the definer's. (A SECURITY DEFINER function would see the owner's role and
-- defeat the check.)
--
-- Idempotent: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS / CREATE.

-- (a) role column. IF NOT EXISTS keeps re-runs safe; the DEFAULT backfills
-- every existing row to 'learner'.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'learner';

-- Constrain the allowed values. Guarded add: PG15 has no
-- ADD CONSTRAINT IF NOT EXISTS for CHECKs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_profiles_role'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_role
      CHECK (role IN ('learner', 'teacher', 'admin'));
  END IF;
END $$;

-- (b) role-write lockdown trigger. SECURITY INVOKER so current_user reflects the
-- actual caller (service_role bypasses RLS but still runs the trigger).
CREATE OR REPLACE FUNCTION public.enforce_profile_role_write()
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
  -- privileged. current_setting(..., true) returns NULL (not an error) when the
  -- GUC is unset, e.g. a direct psql session with no JWT context; NULLIF guards
  -- against an empty-string GUC (''::jsonb would raise). COALESCE keeps the
  -- result a strict boolean so the IF below never sees NULL.
  jwt_role := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  is_privileged := COALESCE(current_user = 'service_role' OR jwt_role = 'service_role', false);

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Non-privileged caller may not change role at all. IS DISTINCT FROM is
    -- NULL-safe and lets no-op updates (role unchanged) through.
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION
        'permission denied: role may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- Non-privileged caller may only ever create a 'learner'. Silently coerce
    -- anything else so ordinary signup (which never sets role) still succeeds
    -- and a crafted escalating insert is downgraded rather than rejected.
    IF NEW.role IS DISTINCT FROM 'learner' THEN
      NEW.role := 'learner';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_role_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_role_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_role_write();

-- Trigger functions run in trigger context (no EXECUTE needed), so this helper
-- must never be callable via PostgREST RPC. Revoke the default PUBLIC grant.
REVOKE EXECUTE ON FUNCTION public.enforce_profile_role_write() FROM PUBLIC, anon, authenticated;
