-- B2 (#478): by-wallet public read of the four non-sensitive profile fields.
-- Mirrors the public_user_xp house pattern — an owner-rights view over the
-- RLS-locked profiles table. The view's SELECT list is the column filter, so
-- google_id / github_id / deleted_at / deletion_requested_at etc. are NEVER
-- exposed; profiles itself stays own-row-only for direct PostgREST access (no
-- broad RLS policy is added, which is why a view and not security_invoker).
-- Rows are limited to public, non-deleted profiles that have a wallet to key on.
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
