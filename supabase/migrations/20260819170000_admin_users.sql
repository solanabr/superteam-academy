-- Admin allowlist for the /admin panel (owner-approved 2026-08-19). Replaces
-- the shared ADMIN_SECRET: per-person access via the learner's own Supabase
-- session. Service-role only — RLS enabled with ZERO policies and explicit
-- REVOKEs, so no client role can even see who is admin; the API routes check
-- membership via createAdminClient().
CREATE TABLE public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by TEXT NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_users FROM PUBLIC;
REVOKE ALL ON public.admin_users FROM anon;
REVOKE ALL ON public.admin_users FROM authenticated;

-- Seed applied on prod with the 4 owner-designated accounts; the repo file
-- carries no user ids (they are environment data, not schema).
