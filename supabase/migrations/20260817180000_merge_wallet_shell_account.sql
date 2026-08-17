-- Auto-merge of a wallet-shaped shell account into the socially-signed-in
-- account that owns its wallet (AUTH-FLOWS.md §7 "Mixed-method account fork").
--
-- The fork: an embedded-wallet SIWS sign-in created a shell account keyed by a
-- synthetic `<pubkey>@wallet.superteam-lms.local` email; the same person's
-- Google sign-in through Dynamic lands on their real-email account. Two
-- accounts, XP split. The Dynamic JWT carries the wallet as a `blockchain`
-- verified credential — cryptographic proof that the shell's wallet belongs to
-- the socially-signed-in user. That proof, never an email match, is what
-- entitles the caller to this merge.
--
-- One transaction, called only by service_role from /api/auth/dynamic. Row
-- policy on unique-key collisions: keep the target's row (precedent: the
-- 2026-08-13 manual merge, daily-quest rows). user_xp is the one aggregate:
-- totals are summed, streaks take the greater value.
--
-- The final FK sweep is the fail-closed guard for tables this function does
-- not know about: any remaining row referencing the shell aborts the whole
-- transaction, so a table added later can never be silently stranded — the
-- merge just stops happening until this function learns the new table.

CREATE OR REPLACE FUNCTION public.merge_wallet_shell_account(
  p_target UUID,
  p_shell  UUID,
  p_wallet TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_target_profile public.profiles%ROWTYPE;
  v_shell_profile  public.profiles%ROWTYPE;
  v_shell_email    TEXT;
  v_shell_xp       public.user_xp%ROWTYPE;
  v_moved          JSONB := '{}'::jsonb;
  v_count          BIGINT;
  v_fk             RECORD;
BEGIN
  -- trg_enforce_profile_wallet_write only lets service_role touch
  -- wallet_address, checked as `current_user = 'service_role' OR
  -- request.jwt.claims->>'role' = 'service_role'`. Inside a SECURITY DEFINER
  -- function Postgres forbids `SET ROLE` outright (the 2026-08-13 manual
  -- merge ran it in a raw session, where it IS allowed), so satisfy the
  -- trigger's claims branch instead — the same channel PostgREST uses when
  -- the service-role client calls this RPC, made explicit so the function
  -- also works when invoked from a maintenance session as postgres.
  -- is_local => reverts at transaction end.
  PERFORM pg_catalog.set_config(
    'request.jwt.claims', '{"role":"service_role"}', true
  );

  IF p_target = p_shell THEN
    RAISE EXCEPTION 'merge refused: target and shell are the same account';
  END IF;
  IF p_wallet IS NULL OR btrim(p_wallet) = '' THEN
    RAISE EXCEPTION 'merge refused: empty wallet';
  END IF;

  -- Deterministic lock order so two concurrent merges cannot deadlock.
  PERFORM 1 FROM public.profiles WHERE id = LEAST(p_target, p_shell) FOR UPDATE;
  PERFORM 1 FROM public.profiles WHERE id = GREATEST(p_target, p_shell) FOR UPDATE;

  SELECT * INTO v_target_profile FROM public.profiles WHERE id = p_target;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'merge refused: target profile not found';
  END IF;
  SELECT * INTO v_shell_profile FROM public.profiles WHERE id = p_shell;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'merge refused: shell profile not found';
  END IF;

  -- The target must genuinely lack a wallet: this merge exists to give it one.
  IF v_target_profile.wallet_address IS NOT NULL THEN
    RAISE EXCEPTION 'merge refused: target already has a wallet';
  END IF;
  IF v_target_profile.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'merge refused: target is tombstoned';
  END IF;

  -- Shell-ness, re-proven here rather than trusted from the caller:
  -- the wallet is the one the JWT proved, the account was never anything but
  -- a wallet shell (synthetic email, no linked OAuth), and it is alive. A
  -- tombstoned shell was deleted by its owner — its data stays dead.
  IF v_shell_profile.wallet_address IS DISTINCT FROM p_wallet THEN
    RAISE EXCEPTION 'merge refused: shell wallet does not match';
  END IF;
  IF v_shell_profile.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'merge refused: shell is tombstoned';
  END IF;
  IF v_shell_profile.google_id IS NOT NULL OR v_shell_profile.github_id IS NOT NULL THEN
    RAISE EXCEPTION 'merge refused: shell has linked OAuth identities';
  END IF;
  SELECT u.email INTO v_shell_email FROM auth.users u WHERE u.id = p_shell;
  IF v_shell_email IS NULL
     OR v_shell_email NOT LIKE '%@wallet.superteam-lms.local' THEN
    RAISE EXCEPTION 'merge refused: shell email is not a synthetic wallet email';
  END IF;

  -- ── user_xp: the one aggregate. Sum totals, recompute level with the app's
  -- formula (floor(sqrt(xp/100))), keep the better streak, cap freezes at the
  -- inventory bound the CHECK constraint enforces.
  SELECT * INTO v_shell_xp FROM public.user_xp WHERE user_id = p_shell;
  IF FOUND THEN
    UPDATE public.user_xp t SET
      total_xp           = t.total_xp + v_shell_xp.total_xp,
      level              = floor(sqrt((t.total_xp + v_shell_xp.total_xp) / 100.0))::int,
      current_streak     = GREATEST(t.current_streak, v_shell_xp.current_streak),
      longest_streak     = GREATEST(t.longest_streak, v_shell_xp.longest_streak),
      last_activity_date = GREATEST(t.last_activity_date, v_shell_xp.last_activity_date),
      streak_freezes     = LEAST(2, t.streak_freezes + v_shell_xp.streak_freezes)
    WHERE t.user_id = p_target;
    IF NOT FOUND THEN
      UPDATE public.user_xp SET user_id = p_target WHERE user_id = p_shell;
    ELSE
      DELETE FROM public.user_xp WHERE user_id = p_shell;
    END IF;
    v_moved := v_moved || jsonb_build_object('user_xp', 1);
  END IF;

  -- ── Keyed tables: move what does not collide, keep the target's row where
  -- it does, then drop the shell's leftovers. Keys mirror each table's
  -- UNIQUE/PK over user_id.
  UPDATE public.enrollments s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.enrollments x
                      WHERE x.user_id = p_target AND x.course_id = s.course_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('enrollments', v_count);
  DELETE FROM public.enrollments WHERE user_id = p_shell;

  UPDATE public.user_progress s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.user_progress x
                      WHERE x.user_id = p_target AND x.lesson_id = s.lesson_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('user_progress', v_count);
  DELETE FROM public.user_progress WHERE user_id = p_shell;

  UPDATE public.user_achievements s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.user_achievements x
                      WHERE x.user_id = p_target AND x.achievement_id = s.achievement_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('user_achievements', v_count);
  DELETE FROM public.user_achievements WHERE user_id = p_shell;

  UPDATE public.certificates s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.certificates x
                      WHERE x.user_id = p_target AND x.course_id = s.course_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('certificates', v_count);
  DELETE FROM public.certificates WHERE user_id = p_shell;

  UPDATE public.streak_freezes_used s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.streak_freezes_used x
                      WHERE x.user_id = p_target AND x.frozen_date = s.frozen_date);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('streak_freezes_used', v_count);
  DELETE FROM public.streak_freezes_used WHERE user_id = p_shell;

  UPDATE public.pending_onchain_actions s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.pending_onchain_actions x
                      WHERE x.user_id = p_target
                        AND x.action_type = s.action_type
                        AND x.reference_id = s.reference_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('pending_onchain_actions', v_count);
  DELETE FROM public.pending_onchain_actions WHERE user_id = p_shell;

  UPDATE public.user_daily_quests s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.user_daily_quests x
                      WHERE x.user_id = p_target
                        AND x.quest_id = s.quest_id
                        AND x.period_start = s.period_start);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('user_daily_quests', v_count);
  DELETE FROM public.user_daily_quests WHERE user_id = p_shell;

  UPDATE public.deployed_programs s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.deployed_programs x
                      WHERE x.user_id = p_target
                        AND x.course_id = s.course_id
                        AND x.lesson_id = s.lesson_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('deployed_programs', v_count);
  DELETE FROM public.deployed_programs WHERE user_id = p_shell;

  UPDATE public.challenge_assists s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.challenge_assists x
                      WHERE x.user_id = p_target AND x.lesson_id = s.lesson_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('challenge_assists', v_count);
  DELETE FROM public.challenge_assists WHERE user_id = p_shell;

  UPDATE public.review_items s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.review_items x
                      WHERE x.user_id = p_target AND x.item_key = s.item_key);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('review_items', v_count);
  DELETE FROM public.review_items WHERE user_id = p_shell;

  UPDATE public.league_members s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.league_members x
                      WHERE x.user_id = p_target AND x.week_start = s.week_start);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('league_members', v_count);
  DELETE FROM public.league_members WHERE user_id = p_shell;

  UPDATE public.thread_views s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.thread_views x
                      WHERE x.user_id = p_target AND x.thread_id = s.thread_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('thread_views', v_count);
  DELETE FROM public.thread_views WHERE user_id = p_shell;

  UPDATE public.email_reminder_log s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.email_reminder_log x
                      WHERE x.user_id = p_target
                        AND x.kind = s.kind
                        AND x.sent_on = s.sent_on);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('email_reminder_log', v_count);
  DELETE FROM public.email_reminder_log WHERE user_id = p_shell;

  -- Votes carry two partial unique indexes (thread / answer), so the collision
  -- probe is per-target-kind.
  UPDATE public.votes s SET user_id = p_target
    WHERE s.user_id = p_shell AND s.thread_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.votes x
                      WHERE x.user_id = p_target AND x.thread_id = s.thread_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('thread_votes', v_count);
  UPDATE public.votes s SET user_id = p_target
    WHERE s.user_id = p_shell AND s.answer_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.votes x
                      WHERE x.user_id = p_target AND x.answer_id = s.answer_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('answer_votes', v_count);
  DELETE FROM public.votes WHERE user_id = p_shell;

  -- email_subscriptions is one row per user. A shell's consent was collected
  -- against an undeliverable synthetic address; it only moves when the target
  -- has no row at all, and the target's real consent always wins.
  UPDATE public.email_subscriptions s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.email_subscriptions x
                      WHERE x.user_id = p_target);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('email_subscriptions', v_count);
  DELETE FROM public.email_subscriptions WHERE user_id = p_shell;

  -- ── Unkeyed tables: plain moves, nothing can collide.
  UPDATE public.xp_transactions SET user_id = p_target WHERE user_id = p_shell;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('xp_transactions', v_count);

  UPDATE public.threads SET author_id = p_target WHERE author_id = p_shell;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('threads', v_count);

  UPDATE public.answers SET author_id = p_target WHERE author_id = p_shell;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('answers', v_count);

  UPDATE public.flags SET reporter_id = p_target WHERE reporter_id = p_shell;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('flags', v_count);
  UPDATE public.flags SET resolved_by = p_target WHERE resolved_by = p_shell;

  -- ── The wallet itself. Shell first (wallet_address is UNIQUE), then target.
  UPDATE public.profiles SET wallet_address = NULL WHERE id = p_shell;
  UPDATE public.profiles SET wallet_address = p_wallet WHERE id = p_target;

  -- Tombstone the shell so no sign-in path can revive it: SIWS no longer
  -- resolves it (wallet nulled) and isAccountDeleted refuses the rest.
  UPDATE public.profiles SET deleted_at = now() WHERE id = p_shell;

  -- ── Fail-closed sweep: every FK into profiles/auth.users must be clean of
  -- the shell. A table this function does not cover aborts the merge here and
  -- rolls everything back.
  FOR v_fk IN
    SELECT c.conrelid::regclass AS tbl, a.attname AS col
    FROM pg_constraint c
    JOIN LATERAL unnest(c.conkey) AS k(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.contype = 'f'
      AND c.confrelid IN ('public.profiles'::regclass, 'auth.users'::regclass)
      AND c.conrelid <> 'public.profiles'::regclass
      AND a.atttypid = 'uuid'::regtype
  LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I = $1', v_fk.tbl, v_fk.col)
      INTO v_count USING p_shell;
    IF v_count > 0 THEN
      RAISE EXCEPTION
        'merge aborted: % row(s) still reference the shell via %.% — extend merge_wallet_shell_account',
        v_count, v_fk.tbl, v_fk.col;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'target', p_target,
    'shell', p_shell,
    'wallet', p_wallet,
    'moved', v_moved
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION
  public.merge_wallet_shell_account(UUID, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.merge_wallet_shell_account(UUID, UUID, TEXT)
  TO service_role;
