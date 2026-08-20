-- Moderator-side content actions for the admin flag queue (#1131)
--
-- The moderation queue could only ever mark a REPORT handled — resolve and
-- dismiss both wrote flags.status and nothing else, so the reported content was
-- never touched. This adds what an admin needs to action a report from the
-- panel: moderator content RPCs, and an audit row per decision.
--
-- ATOMICITY: each RPC does the content change, the flag write, and the audit
-- INSERT in ONE transaction. The route used to make three separate PostgREST
-- round-trips (delete → resolve flag → audit), so a crash between them could
-- leave content removed with no audit row — exactly the record a destructive
-- moderation action must never lose. Now it either all commits or none does.
--
-- The author-gated soft_delete_thread / soft_delete_answer are NOT reused or
-- widened: their `author_id = p_user_id` check is what makes them safe to expose
-- to the author-facing routes, and a p_user_id-optional variant would be one
-- typo away from letting any caller delete anything. These are separate
-- functions with the same cascade semantics and no ownership check, reachable
-- only by service_role — i.e. only from an admin-gated API route.

CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN (
    'removed_thread', 'removed_answer', 'locked_thread', 'resolved', 'dismissed'
  )),
  -- ON DELETE SET NULL, not CASCADE: the audit row must outlive the content it
  -- describes. A hard-deleted thread is exactly the case where the record of who
  -- removed it matters most.
  thread_id UUID REFERENCES public.threads(id) ON DELETE SET NULL,
  answer_id UUID REFERENCES public.answers(id) ON DELETE SET NULL,
  flag_id UUID REFERENCES public.flags(id) ON DELETE SET NULL,
  -- The acting admin. This column only became possible with the `admin_users`
  -- allowlist (20260819170000): under the retired shared ADMIN_SECRET every
  -- moderator was the same anonymous caller and there was no identity to store.
  -- requireAdminAuth() now returns the acting admin's user id, so the RPCs stamp
  -- it here and in flags.resolved_by. Nullable because the FK is ON DELETE SET
  -- NULL and a future non-session caller may not carry one — an audit row
  -- without an actor still beats no audit row.
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at
  ON public.moderation_actions(created_at DESC);

-- Service-role only: RLS on with ZERO policies, plus explicit REVOKEs. Nothing
-- reaches this table except createAdminClient() from an admin-gated route.
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.moderation_actions FROM PUBLIC;
REVOKE ALL ON public.moderation_actions FROM anon;
REVOKE ALL ON public.moderation_actions FROM authenticated;

-- Moderator soft-delete of a thread + flag-resolve + audit, in one transaction.
-- Same cascade as soft_delete_thread (deleted_at on the thread and on its live
-- answers), no ownership check.
--
-- XP CLAWBACK SCOPE (v1, deliberate): only the removed thread's own creation XP
-- is revoked, via the existing idempotency key `thread:<id>`. Upvote XP on the
-- thread and the creation XP of the answers this cascade tombstones are LEFT IN
-- PLACE — reversing those means walking every vote row and every cascaded
-- answer, and getting the accepted-answer bonus right, which is a bigger change
-- than the moderation buttons this ships. Removing spam therefore still leaves
-- the spammer any vote XP it earned.
CREATE OR REPLACE FUNCTION public.moderate_soft_delete_thread(
  p_thread_id UUID,
  p_flag_id UUID,
  p_actor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_author_id UUID;
BEGIN
  SELECT author_id INTO v_author_id
  FROM public.threads
  WHERE id = p_thread_id AND deleted_at IS NULL;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Thread not found or already removed';
  END IF;

  UPDATE public.threads SET deleted_at = NOW() WHERE id = p_thread_id;
  UPDATE public.answers SET deleted_at = NOW()
   WHERE thread_id = p_thread_id AND deleted_at IS NULL;

  PERFORM public.revoke_community_xp(v_author_id, 'thread:' || p_thread_id::text);

  -- Removal settles the report.
  UPDATE public.flags
     SET status = 'resolved', resolved_at = NOW(), resolved_by = p_actor_id
   WHERE id = p_flag_id;

  INSERT INTO public.moderation_actions(action, thread_id, flag_id, actor_id)
  VALUES ('removed_thread', p_thread_id, p_flag_id, p_actor_id);
END;
$$;

-- Moderator soft-delete of a single answer + flag-resolve + audit, in one
-- transaction. Same bookkeeping as soft_delete_answer (answer_count decrement
-- with a zero floor, un-accept if it was the accepted answer), no ownership
-- check.
--
-- XP CLAWBACK SCOPE (v1, deliberate): only this answer's own creation XP
-- (`answer:<id>`), for the same reason as above. In particular the
-- accepted-answer bonus (`accept:<thread>:<answer>`) is NOT revoked when an
-- accepted answer is removed.
CREATE OR REPLACE FUNCTION public.moderate_soft_delete_answer(
  p_answer_id UUID,
  p_flag_id UUID,
  p_actor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_thread_id UUID;
  v_author_id UUID;
  v_was_accepted BOOLEAN;
BEGIN
  SELECT thread_id, author_id, is_accepted
    INTO v_thread_id, v_author_id, v_was_accepted
  FROM public.answers
  WHERE id = p_answer_id AND deleted_at IS NULL;

  IF v_thread_id IS NULL THEN
    RAISE EXCEPTION 'Answer not found or already removed';
  END IF;

  UPDATE public.answers SET deleted_at = NOW() WHERE id = p_answer_id;
  UPDATE public.threads SET answer_count = GREATEST(answer_count - 1, 0)
   WHERE id = v_thread_id;

  IF v_was_accepted THEN
    UPDATE public.threads SET is_solved = FALSE, accepted_answer_id = NULL
     WHERE id = v_thread_id;
  END IF;

  PERFORM public.revoke_community_xp(v_author_id, 'answer:' || p_answer_id::text);

  UPDATE public.flags
     SET status = 'resolved', resolved_at = NOW(), resolved_by = p_actor_id
   WHERE id = p_flag_id;

  INSERT INTO public.moderation_actions(action, answer_id, flag_id, actor_id)
  VALUES ('removed_answer', p_answer_id, p_flag_id, p_actor_id);
END;
$$;

-- Moderator lock of a thread + audit, in one transaction. A lock stops the
-- argument without settling the report, so it deliberately does NOT resolve the
-- flag — the moderator still resolves or dismisses it afterwards.
--
-- No-op tolerant: an already-locked thread still writes the audit row (the
-- moderator did take the action) but skips the redundant UPDATE.
CREATE OR REPLACE FUNCTION public.moderate_lock_thread(
  p_thread_id UUID,
  p_flag_id UUID,
  p_actor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_is_locked BOOLEAN;
BEGIN
  SELECT is_locked INTO v_is_locked
  FROM public.threads
  WHERE id = p_thread_id AND deleted_at IS NULL;

  IF v_is_locked IS NULL THEN
    RAISE EXCEPTION 'Thread not found or already removed';
  END IF;

  IF NOT v_is_locked THEN
    UPDATE public.threads SET is_locked = TRUE WHERE id = p_thread_id;
  END IF;

  INSERT INTO public.moderation_actions(action, thread_id, flag_id, actor_id)
  VALUES ('locked_thread', p_thread_id, p_flag_id, p_actor_id);
END;
$$;

-- Resolve or dismiss a report with no content change (out-of-band handling) +
-- audit, in one transaction. p_dismiss picks which: dismiss = the report is not
-- valid, resolve = handled elsewhere. The target ids for the audit row are read
-- from the flag itself so the caller cannot mis-pair them.
CREATE OR REPLACE FUNCTION public.moderate_resolve_flag(
  p_flag_id UUID,
  p_dismiss BOOLEAN,
  p_actor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_thread_id UUID;
  v_answer_id UUID;
  v_status TEXT := CASE WHEN p_dismiss THEN 'dismissed' ELSE 'resolved' END;
BEGIN
  SELECT thread_id, answer_id INTO v_thread_id, v_answer_id
  FROM public.flags
  WHERE id = p_flag_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Flag not found or already resolved';
  END IF;

  UPDATE public.flags
     SET status = v_status, resolved_at = NOW(), resolved_by = p_actor_id
   WHERE id = p_flag_id;

  INSERT INTO public.moderation_actions(action, thread_id, answer_id, flag_id, actor_id)
  VALUES (v_status, v_thread_id, v_answer_id, p_flag_id, p_actor_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.moderate_soft_delete_thread(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_soft_delete_thread(UUID, UUID, UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.moderate_soft_delete_answer(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_soft_delete_answer(UUID, UUID, UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.moderate_lock_thread(UUID, UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_lock_thread(UUID, UUID, UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION public.moderate_resolve_flag(UUID, BOOLEAN, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_resolve_flag(UUID, BOOLEAN, UUID) TO service_role;
