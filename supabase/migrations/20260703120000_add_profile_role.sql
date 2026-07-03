-- Migration: add_profile_role
-- Adds a role to profiles for teacher-authored courses (mediated authoring).
--   learner (default) | teacher | admin
-- Granted/revoked from the admin panel via an ADMIN_SECRET-gated route (which
-- uses the service_role key); read server-side to gate /teach/* and the teacher
-- course API.
--
-- SECURITY: the existing RLS UPDATE policy ("Users can update their own
-- profile") is USING (auth.uid() = id) with NO column restriction, so an
-- authenticated user could otherwise `UPDATE profiles SET role='admin'` on their
-- own row. A BEFORE UPDATE trigger pins `role` to its previous value for any
-- caller that is not the service_role, so only the admin API can change it.
-- Attempts by users are silently ignored (no error, no escalation).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'learner'
  CHECK (role IN ('learner', 'teacher', 'admin'));

CREATE OR REPLACE FUNCTION public.enforce_profile_role_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Only the service_role (admin API) may change `role`; keep the old value for
  -- everyone else.
  IF NEW.role IS DISTINCT FROM OLD.role
     AND coalesce(auth.role(), '') <> 'service_role' THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_role_immutable ON profiles;
CREATE TRIGGER enforce_profile_role_immutable
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_role_immutable();
