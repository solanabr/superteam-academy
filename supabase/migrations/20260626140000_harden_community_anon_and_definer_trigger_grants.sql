-- Reconcile fresh / migration-based deploys with the live-DB community-grant
-- hardening (issue #210). The baseline migration already column-scopes
-- authenticated UPDATE on threads/answers, but two gaps remained that were
-- applied to the live DB and are mirrored here:
--
--   1. anon must not hold UPDATE on threads/answers. No anon UPDATE RLS policy
--      exists, so the grant is inert, but Supabase default privileges can grant
--      it on a fresh deploy — revoke it for defense-in-depth.
--   2. The SECURITY DEFINER denormalized-counter trigger functions
--      (update_vote_score / update_answer_count / update_last_activity) carry
--      the default PUBLIC execute grant. They run only in trigger context
--      (which does not require EXECUTE), so they must never be callable via
--      PostgREST RPC. Revoke it. Triggers continue to fire normally (trigger
--      execution does not check EXECUTE).
--
-- Idempotent: REVOKE of an absent privilege is a no-op.

REVOKE UPDATE ON public.threads FROM anon;
REVOKE UPDATE ON public.answers FROM anon;

REVOKE EXECUTE ON FUNCTION public.update_vote_score()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_answer_count()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_last_activity() FROM PUBLIC, anon, authenticated;
