-- Teacher identity: editorial display name + verified badge (#997)
--
-- Course pages show a teacher's auto-generated wallet nickname
-- ("brave-anchor-9000") or a truncated wallet. Neither reads as a credible
-- author, and nothing distinguishes an official Superteam instructor from any
-- wallet that created a course.
--
-- BOTH columns are ADMIN-CONTROLLED, not learner-editable. A learner can
-- already UPDATE their own profiles row, so if these were self-writable anyone
-- could rename themselves "Superteam Official" and self-award a verified badge
-- — at which point the badge means nothing. They therefore follow the
-- wallet_address precedent (#408): service_role writes only, enforced by a
-- BEFORE trigger rather than by RLS policy alone.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.display_name IS
  'Editorial display name shown instead of the generated username. Admin-set (service_role only). NULL falls back to username. Never used for routing — usernames are unique and route-safe, display names are neither.';
COMMENT ON COLUMN public.profiles.verified IS
  'Verified-teacher badge. Admin-set (service_role only); self-service would make the badge meaningless.';

-- Extend the existing guard rather than adding a second trigger, so there is
-- one place that answers "which profile columns are privileged".
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
  jwt_role := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  is_privileged := COALESCE(current_user = 'service_role' OR jwt_role = 'service_role', false);

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.wallet_address IS DISTINCT FROM OLD.wallet_address THEN
      RAISE EXCEPTION
        'permission denied: wallet_address may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.display_name IS DISTINCT FROM OLD.display_name THEN
      RAISE EXCEPTION
        'permission denied: display_name may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.verified IS DISTINCT FROM OLD.verified THEN
      RAISE EXCEPTION
        'permission denied: verified may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- Coerce rather than raise: the signup path inserts its own row, and a
    -- hard failure there would block account creation outright.
    IF NEW.wallet_address IS NOT NULL THEN
      NEW.wallet_address := NULL;
    END IF;
    IF NEW.display_name IS NOT NULL THEN
      NEW.display_name := NULL;
    END IF;
    IF NEW.verified THEN
      NEW.verified := false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_wallet_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_wallet_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_wallet_write();

-- Republish the public view with the two new fields APPENDED.
--
-- Column list and order are copied verbatim from the current definition
-- (20260726130000_route_public_profile_reads_through_view.sql) with the new
-- columns added at the end. Two constraints force that:
--
--   1. CREATE OR REPLACE VIEW cannot drop or reorder existing columns — it
--      errors. New columns may only be appended.
--   2. `id` and `created_at` are read by fetchPublicProfile (lib/profile/
--      profile-data.ts); dropping them would break every public profile page.
--
-- The WHERE clause is likewise unchanged: it has NOT filtered on
-- `wallet_address IS NOT NULL` since #493, so public profiles without a linked
-- wallet stay visible. Re-adding that filter here would silently hide them.
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
  p.verified
FROM public.profiles p
WHERE p.is_public = true
  AND p.deleted_at IS NULL;

REVOKE ALL ON public.public_profiles FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
