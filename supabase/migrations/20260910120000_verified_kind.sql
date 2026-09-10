-- Verified badge KINDS: Superteam member vs verified partner (#1234)
--
-- `profiles.verified` (#997) answers "is this author vouched for" with a
-- boolean, and the course page prints one green seal for every yes. The
-- Academy now publishes courses from two different kinds of author — Superteam
-- members and outside partner organisations (Forge College first) — and a
-- learner deciding whether to trust a course should be able to tell which they
-- are looking at. One badge cannot say that.
--
-- `verified_kind` carries the WHICH; `verified` keeps carrying the WHETHER.
-- Splitting them rather than widening `verified` into an enum means every
-- existing reader (`profile.verified` in the hero panel, the instructor card)
-- keeps working untouched, and a verified author whose kind nobody has set yet
-- still gets today's badge instead of vanishing from the UI.
--
-- ADMIN-CONTROLLED like the two columns it joins. A self-writable badge that
-- says "Superteam member" would be worth exactly nothing, so this follows the
-- wallet_address precedent (#408): service_role writes only, enforced by the
-- same BEFORE trigger, so there is still ONE place that answers "which profile
-- columns are privileged".

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified_kind TEXT;

-- The closed set lives in the database, not only in TypeScript: this column is
-- written by admin tooling and by hand, and a typo'd kind would render as an
-- unbadged author with no error anywhere.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_profiles_verified_kind;
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_verified_kind CHECK (
    verified_kind IS NULL OR verified_kind IN ('superteam', 'partner')
  );

-- A kind without the flag would be invisible (every reader gates on
-- `verified`), so the pair can never drift into that state.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_profiles_verified_kind_needs_verified;
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_verified_kind_needs_verified CHECK (
    verified_kind IS NULL OR verified
  );

COMMENT ON COLUMN public.profiles.verified_kind IS
  'Which verified badge to show: superteam (Superteam member) or partner (verified partner). NULL on a verified profile falls back to the generic teacher badge. Admin-set (service_role only) — a self-awardable "Superteam member" badge would be meaningless.';

-- Extend the existing guard rather than adding a second trigger (#997's note).
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
    IF NEW.verified_kind IS DISTINCT FROM OLD.verified_kind THEN
      RAISE EXCEPTION
        'permission denied: verified_kind may only be changed by service_role'
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
    IF NEW.verified_kind IS NOT NULL THEN
      NEW.verified_kind := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_wallet_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_wallet_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_wallet_write();

-- Republish the public view with the new field APPENDED.
--
-- Column list and order are copied verbatim from the current definition
-- (20260805120000_teacher_display_name_and_verified.sql) with `verified_kind`
-- added at the end, for the two reasons that migration records: CREATE OR
-- REPLACE VIEW cannot drop or reorder existing columns, and `id`/`created_at`
-- are read by fetchPublicProfile. The WHERE clause is likewise unchanged — it
-- has NOT filtered on `wallet_address IS NOT NULL` since #493, and re-adding
-- that filter here would silently hide profiles with no linked wallet.
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
  p.verified_kind
FROM public.profiles p
WHERE p.is_public = true
  AND p.deleted_at IS NULL;

REVOKE ALL ON public.public_profiles FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Backfill: the three authors publishing today (owner, 2026-09-10)
-- ─────────────────────────────────────────────────────────────────────────
-- Matched by WALLET, which is what a course's on-chain `Course.creator` is and
-- therefore the only identifier that ties an author to the courses they
-- publish. Each UPDATE is a no-op when no such profile exists yet, so this
-- migration is safe to apply before an author has signed in — but it then does
-- NOTHING for them, so re-run the statement (or set the column from the admin
-- surface) once the profile exists. `verified` is set alongside the kind
-- because every reader gates on it.

-- Kaue Kano — Superteam member. Creator of btc-to-sol-evolution,
-- pilula-solana-superteam and solana-speedrun in the current content bundle.
UPDATE public.profiles
   SET verified = true, verified_kind = 'superteam'
 WHERE wallet_address = '3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ';

-- Artur Moura (Forge College) — verified partner. Creator of
-- visao-geral-solana, the Forge College pilot.
UPDATE public.profiles
   SET verified = true, verified_kind = 'partner'
 WHERE wallet_address = 'Em8D6XyuXvNUK1YgLKBaji7HbbrZZq7fCdq3sGMXqxVZ';

-- David Potolski Lafetá — Superteam member. His course is not in the bundle
-- yet, so there is no `Course.creator` wallet to match on; matched by the
-- account's sign-in email instead (profiles.id IS auth.users.id).
--
-- VERIFY THIS ONE ON APPLY: if his account signed in with a wallet or a
-- different address, this matches nothing and silently does nothing. The check
-- is `SELECT username, verified, verified_kind FROM public.profiles WHERE
-- verified_kind = 'superteam'` — it must return HIS row as well as Kaue's.
UPDATE public.profiles p
   SET verified = true, verified_kind = 'superteam'
  FROM auth.users u
 WHERE u.id = p.id
   AND lower(u.email) = 'davidpotolskilafeta@gmail.com';
