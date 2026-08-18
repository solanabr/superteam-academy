-- Subject rung for /api/auth/dynamic (#1055): resolve an account by the OAuth
-- provider's stable subject id BEFORE falling back to email matching.
--
-- The gap: a wallet-first account carries a synthetic
-- `<pubkey>@wallet.superteam-lms.local` email, so its deliberately-linked
-- Google identity can never be reached by the route's email rung — a Google
-- sign-in forks a brand-new account instead of recovering the existing one.
-- `auth.identities` is the trustworthy record of that link (written only by
-- GoTrue during linkIdentity/OAuth); `profiles.google_id`/`github_id` are
-- client-written under RLS and must never resolve accounts.
--
-- SECURITY DEFINER because auth.identities is not readable through PostgREST;
-- service_role-only, called exclusively from the dynamic auth route.

CREATE OR REPLACE FUNCTION public.find_user_by_oauth_identity(
  p_provider TEXT,
  p_subject  TEXT
) RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT i.user_id
  FROM auth.identities i
  WHERE btrim(coalesce(p_provider, '')) <> ''
    AND btrim(coalesce(p_subject, '')) <> ''
    AND i.provider = p_provider
    AND i.provider_id = p_subject
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION
  public.find_user_by_oauth_identity(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.find_user_by_oauth_identity(TEXT, TEXT)
  TO service_role;
