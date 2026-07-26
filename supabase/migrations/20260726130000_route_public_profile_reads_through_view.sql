-- ============================================
-- Route public/cross-user profile reads through public_profiles (#493)
-- ============================================
-- Follow-up to #486/#491, which shut the ANON google_id/github_id leak by
-- column-restricting anon's SELECT on profiles. `authenticated` still holds a
-- whole-table SELECT grant (it needs its OWN google_id for settings/unlink), so
-- with the "Public profiles are viewable by everyone" row policy in place, any
-- logged-in user could still read the OAuth subject IDs (google_id/github_id)
-- of ANY is_public=true profile — a logged-in deanonymization leak
-- (public wallet/username -> GitHub/Google identity). Confirmed on prod:
-- has_column_privilege('authenticated','public.profiles','google_id','SELECT') = true.
--
-- A column-level REVOKE for authenticated is not an option: authenticated
-- legitimately reads its OWN google_id via the browser client (settings
-- `select("*")`, unlink), and column grants are not row-aware. The fix is to
-- drop the public-profile ROW policy so `authenticated`/`anon` can only reach
-- their OWN profiles row (own-row policy), and route every cross-user read
-- through the curated `public_profiles` view (#478/#485), which never exposes a
-- sensitive column. RLS restricting the base table to own-row is what makes the
-- retained wide column grant harmless: no other user's row is visible, so no
-- other user's google_id is reachable.
--
-- CASCADE HANDLED HERE: four sibling policies gate public reads of related
-- tables with an inline `EXISTS (SELECT 1 FROM profiles WHERE ... is_public)`
-- subquery — enrollments, user_progress, user_achievements, certificates. That
-- subquery runs under the CALLER's RLS on profiles (policy expressions are never
-- owner-privileged), so it currently succeeds ONLY because the public-profile
-- row policy makes public rows visible to anon/authenticated. Dropping that
-- policy would silently break every cross-user read of those four tables (the
-- public profile page reads all four). We repoint the four checks at a
-- SECURITY DEFINER helper, `is_public_profile(uuid)`, which reads profiles as
-- the owner (bypassing RLS) and returns only a boolean — no row/column exposure.
--
-- SENSITIVE (RLS + grants + app read migration). Nothing here has been applied
-- to any live DB. Idempotent (repo convention): CREATE OR REPLACE for the
-- function/view; DROP POLICY IF EXISTS before each CREATE POLICY (Postgres has
-- no CREATE POLICY IF NOT EXISTS). Wrapped in an explicit transaction so a
-- manual psql apply is all-or-nothing, not only under the Supabase CLI's
-- per-file wrap.

BEGIN;

-- SECURITY DEFINER boolean helper: "is this user a public, non-deleted
-- profile?", evaluated as the function owner so it bypasses RLS on profiles.
-- Returns nothing but a boolean, so it cannot leak a row or a sensitive column.
-- STABLE (no writes); search_path pinned to '' (the body fully-qualifies
-- public.profiles) to prevent search-path hijacking — repo convention.
CREATE OR REPLACE FUNCTION public.is_public_profile(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND is_public = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_public_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_profile(uuid) TO anon, authenticated;

-- Repoint the four public-read policies at the helper. Same semantics
-- (visible iff the owning profile is public), but no longer dependent on the
-- caller being able to SELECT the profiles row.
DROP POLICY IF EXISTS "Public profile enrollments are viewable" ON enrollments;
CREATE POLICY "Public profile enrollments are viewable"
  ON enrollments FOR SELECT USING (public.is_public_profile(user_id));

DROP POLICY IF EXISTS "Public profile progress is viewable" ON user_progress;
CREATE POLICY "Public profile progress is viewable"
  ON user_progress FOR SELECT USING (public.is_public_profile(user_id));

DROP POLICY IF EXISTS "Public achievements are viewable on public profiles" ON user_achievements;
CREATE POLICY "Public achievements are viewable on public profiles"
  ON user_achievements FOR SELECT USING (public.is_public_profile(user_id));

DROP POLICY IF EXISTS "Public certificates are viewable by everyone" ON certificates;
CREATE POLICY "Public certificates are viewable by everyone"
  ON certificates FOR SELECT USING (public.is_public_profile(user_id));

-- The leak's root: drop the public-profile ROW policy on the base table.
-- authenticated/anon now reach only their OWN profiles row (own-row SELECT
-- policy for authenticated; anon has none). Cross-user profile identity is
-- served exclusively by public_profiles below.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- public_profiles is now the SOLE cross-user profile read surface, so it must
-- serve the two remaining public read sites that keyed off the base table:
--   - /profile/[username]  needs `id` (to key XP/achievements/certs/progress
--                          reads) + `created_at` (join date), by username.
--   - /certificates/[id]   needs username + wallet_address, by profile `id`.
-- Append `id` and `created_at` (both already public elsewhere — id via
-- public_user_xp/user_achievements/certificates, created_at is the join date),
-- and drop the `wallet_address IS NOT NULL` filter so wallet-less public
-- profiles (OAuth-only, no linked wallet) still resolve on their public pages.
-- Dropping that filter is inert for instructor resolution, which matches on a
-- concrete wallet and so never matches a NULL row.
-- INVARIANT: is_public + deleted_at filters are the access guard; the SELECT
-- list is non-sensitive. Never add google_id/github_id; never drop a filter.
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  p.wallet_address,
  p.username,
  p.avatar_url,
  p.bio,
  p.social_links,
  p.id,
  p.created_at
FROM public.profiles p
WHERE p.is_public = true
  AND p.deleted_at IS NULL;

REVOKE ALL ON public.public_profiles FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMIT;
