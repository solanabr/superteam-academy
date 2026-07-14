-- #486: anon could read google_id / github_id (OAuth subject IDs) of any public
-- profile directly from profiles. The "public profiles viewable by everyone" RLS
-- policy grants row visibility of public rows, and anon holds Supabase's default
-- whole-table SELECT (every column). RLS gates rows, not columns.
--
-- A column-level REVOKE is a NO-OP against a table-level grant (a table grant
-- can't be carved by column — verified: the first attempt left google_id still
-- readable). The correct fix is to drop the table-level SELECT and re-grant
-- SELECT on only the non-sensitive columns.
--
-- Withholds from anon: google_id, github_id, deleted_at, deletion_requested_at.
-- Keeps every column the public profile page / landing count read. Only SELECT
-- is touched; anon's RLS-gated write privileges are unchanged. authenticated is
-- untouched (needs own-row google_id for settings) — the authenticated path is a
-- separate view-routing follow-up.
--
-- Applied + verified on prod (pywhtmidcrptomrabbrw): anon SELECT on
-- google_id/github_id/deleted_at/deletion_requested_at = false; the 10 granted
-- columns = true; authenticated google_id = true (unchanged).
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, wallet_address, username, bio, avatar_url, social_links,
  is_public, name_rerolls_used, wallet_xp_synced_at, created_at
) ON public.profiles TO anon;
