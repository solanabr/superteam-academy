-- B2 (#478): by-wallet public projection of the four non-sensitive profile
-- fields, so instructor identity resolves from a course's creator wallet.
-- Exposes ONLY wallet_address + username + avatar_url + bio + social_links, for
-- public, non-deleted profiles with a wallet. Mirrors the public_user_xp pattern.
--
-- This is a CURATED read surface, NOT the security boundary for the base table:
-- profiles already has a public row-read RLS policy ("Public profiles are
-- viewable by everyone", is_public AND not-deleted) plus wide anon column grants,
-- so anon can already read public rows' columns — including google_id/github_id —
-- directly from profiles. That base-table over-exposure is tracked separately in
-- #486; this view does not cause it and is a strict subset of it. The view's
-- value is a stable, wallet-keyed, 4-column shape for clients.
--
-- Applied + verified on prod (pywhtmidcrptomrabbrw) migration-before-code:
--   exposed columns = wallet_address, username, avatar_url, bio, social_links
--   grants          = anon:SELECT, authenticated:SELECT (SELECT-only)
--   filter          = view rows == public & not-deleted & has-wallet; 0 leaked
--                     deleted/private rows; no sensitive column exposed.
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  p.wallet_address,
  p.username,
  p.avatar_url,
  p.bio,
  p.social_links
FROM public.profiles p
WHERE p.is_public = true
  AND p.deleted_at IS NULL
  AND p.wallet_address IS NOT NULL;

REVOKE ALL ON public.public_profiles FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
