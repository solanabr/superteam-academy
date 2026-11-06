-- Limit client writes on the forum tables to what the app sends, reject answers
-- on locked threads, and move three profiles bookkeeping columns out of
-- self-service writes.
--
-- Who writes what, checked against apps/web/src:
--   threads  create_thread RPC and the accept route, both through the admin client
--   votes    /api/community/votes, admin client only
--   answers  /api/community/answers inserts through the user session; accept and
--            delete go through the admin client
--   flags    /api/community/flags inserts through the user session; moderation
--            goes through the admin client
-- Triggers that keep counters on threads are SECURITY DEFINER and need no client
-- privilege.
--
-- A column-level REVOKE does nothing against a table-level grant, so each table
-- has its table-level writes revoked first (which also clears column grants) and
-- the columns granted back. That lands on the same result whatever the starting
-- grants were, and re-running it is a no-op.
--
-- Rollback: `20261105120000_narrow_forum_and_profile_privileges.sql.rollback`
-- restores the previous grants and policies and drops both triggers.
-- Post-apply check: `20261105120000_narrow_forum_and_profile_privileges.sql.verify`.

BEGIN;

-- These take brief strong locks on busy tables. Fail and retry rather than queue
-- every reader behind a long-running transaction.
SET LOCAL lock_timeout = '5s';

-- ── threads ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can create threads" ON public.threads;
DROP POLICY IF EXISTS "Authors can update own threads" ON public.threads;
REVOKE INSERT, UPDATE, DELETE ON public.threads FROM anon, authenticated;

-- ── votes ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.votes;
DROP POLICY IF EXISTS "Users can update own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON public.votes;
REVOKE INSERT, UPDATE, DELETE ON public.votes FROM anon, authenticated;

-- ── answers ─────────────────────────────────────────────────────────────────
REVOKE INSERT, UPDATE, DELETE ON public.answers FROM anon, authenticated;
GRANT INSERT (thread_id, author_id, body) ON public.answers TO authenticated;
GRANT UPDATE (body) ON public.answers TO authenticated;

-- ── flags ───────────────────────────────────────────────────────────────────
REVOKE INSERT, UPDATE, DELETE ON public.flags FROM anon, authenticated;
GRANT INSERT (reporter_id, thread_id, answer_id, reason, details)
  ON public.flags TO authenticated;

-- ── answers on locked threads ───────────────────────────────────────────────
-- SECURITY DEFINER because the inserting role has no UPDATE on threads, which the
-- row lock requires, and RLS could hide the row. The lock makes a concurrent
-- moderator lock wait for this insert or be seen by it. NO KEY UPDATE is the mode
-- the AFTER INSERT counter triggers take on this row anyway; a weaker share lock
-- here would let two concurrent answers deadlock upgrading it. A missing thread
-- falls through to the foreign key error.
CREATE OR REPLACE FUNCTION public.reject_answer_on_locked_thread()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_locked BOOLEAN;
BEGIN
  SELECT is_locked INTO v_is_locked
    FROM public.threads
   WHERE id = NEW.thread_id
     FOR NO KEY UPDATE;

  IF v_is_locked THEN
    RAISE EXCEPTION 'Thread is locked'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_answer_on_locked_thread()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_reject_answer_on_locked_thread ON public.answers;
CREATE TRIGGER trg_reject_answer_on_locked_thread
  BEFORE INSERT ON public.answers
  FOR EACH ROW EXECUTE FUNCTION public.reject_answer_on_locked_thread();

-- ── profiles bookkeeping columns ────────────────────────────────────────────
-- A separate trigger, as with enforce_profile_deleted_at_write, so the lock list
-- in enforce_profile_wallet_write stays untouched. Same privilege test as that
-- function: SECURITY INVOKER so current_user reflects the caller.
--
-- created_at and wallet_xp_synced_at are service-only: nothing but the link-wallet
-- route (admin client) writes them.
--
-- name_rerolls_used is different. The settings name reroll writes it from the
-- browser together with the new username, so a service-only rule would break that
-- button. A client may only raise it by one; chk_profiles_name_rerolls_max caps it.
CREATE OR REPLACE FUNCTION public.enforce_profile_bookkeeping_write()
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
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION
        'permission denied: created_at may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.wallet_xp_synced_at IS DISTINCT FROM OLD.wallet_xp_synced_at THEN
      RAISE EXCEPTION
        'permission denied: wallet_xp_synced_at may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.name_rerolls_used IS DISTINCT FROM OLD.name_rerolls_used
       AND (NEW.name_rerolls_used IS NULL
            OR NEW.name_rerolls_used <> COALESCE(OLD.name_rerolls_used, 0) + 1) THEN
      RAISE EXCEPTION
        'permission denied: name_rerolls_used may only be raised by one'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- Coerce rather than raise, like the sibling guards: handle_new_user inserts
    -- this row at signup and leaves all three at their defaults.
    NEW.created_at := now();
    NEW.wallet_xp_synced_at := NULL;
    NEW.name_rerolls_used := 0;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_profile_bookkeeping_write()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_profile_bookkeeping_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_bookkeeping_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_bookkeeping_write();

COMMIT;
