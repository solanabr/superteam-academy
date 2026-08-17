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
  v_dup_xp         BIGINT := 0;
  v_cert           public.certificates%ROWTYPE;
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

  -- Shell ledger rows whose idempotency_key collides with a target row are
  -- the SAME award seen from both accounts (daily-quest keys are
  -- `<questId>:<period>`, identical for every user on the same day). They are
  -- dropped below rather than moved — and their amounts are subtracted from
  -- the XP fold here, so the ledger and the total stay consistent (decided
  -- explicitly, adversarial round 2: the award is real once, not twice).
  SELECT COALESCE(sum(s.amount), 0) INTO v_dup_xp
  FROM public.xp_transactions s
  WHERE s.user_id = p_shell
    AND s.idempotency_key IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.xp_transactions x
                WHERE x.user_id = p_target
                  AND x.idempotency_key = s.idempotency_key);

  -- ── user_xp: the one aggregate. Sum totals (minus the duplicate awards
  -- above), recompute level with the app's formula (floor(sqrt(xp/100))),
  -- keep the better streak, cap freezes at the inventory bound the CHECK
  -- constraint enforces.
  SELECT * INTO v_shell_xp FROM public.user_xp WHERE user_id = p_shell;
  IF FOUND THEN
    UPDATE public.user_xp t SET
      total_xp           = GREATEST(0, t.total_xp + v_shell_xp.total_xp - v_dup_xp),
      level              = floor(sqrt(GREATEST(0, t.total_xp + v_shell_xp.total_xp - v_dup_xp) / 100.0))::int,
      current_streak     = GREATEST(t.current_streak, v_shell_xp.current_streak),
      longest_streak     = GREATEST(t.longest_streak, v_shell_xp.longest_streak),
      last_activity_date = GREATEST(t.last_activity_date, v_shell_xp.last_activity_date),
      streak_freezes     = LEAST(2, t.streak_freezes + v_shell_xp.streak_freezes)
    WHERE t.user_id = p_target;
    IF NOT FOUND THEN
      -- v_dup_xp is necessarily 0 here today (both ledger writers upsert
      -- user_xp in the same call), but that invariant is held by convention
      -- across two functions — subtracting is free insurance against a future
      -- writer breaking it.
      UPDATE public.user_xp SET
        user_id  = p_target,
        total_xp = GREATEST(0, total_xp - v_dup_xp),
        level    = floor(sqrt(GREATEST(0, total_xp - v_dup_xp) / 100.0))::int
      WHERE user_id = p_shell;
    ELSE
      DELETE FROM public.user_xp WHERE user_id = p_shell;
    END IF;
    v_moved := v_moved || jsonb_build_object('user_xp', 1, 'duplicate_xp_dropped', v_dup_xp);
  END IF;

  -- ── Keyed tables: move what does not collide, keep the target's row where
  -- it does, then drop the shell's leftovers. Keys mirror each table's
  -- UNIQUE/PK over user_id.
  -- enrollments and user_progress carry ON-CHAIN truth (tx_signature, the
  -- completed bit the program will refuse to re-set — LessonAlreadyCompleted),
  -- and the SHELL is precisely the account that had the wallet, so on a
  -- collision the shell's row is the on-chain one and the target's is the
  -- empty social-only one. Plain keep-target here would strand the learner:
  -- DB says incomplete, chain refuses to re-complete. So colliding target
  -- rows are backfilled from the shell's before the shell's are dropped.
  UPDATE public.enrollments t SET
    tx_signature   = COALESCE(t.tx_signature, s.tx_signature),
    wallet_address = COALESCE(t.wallet_address, s.wallet_address),
    completed_at   = COALESCE(t.completed_at, s.completed_at),
    enrolled_at    = LEAST(t.enrolled_at, s.enrolled_at)
  FROM public.enrollments s
  WHERE t.user_id = p_target AND s.user_id = p_shell
    AND t.course_id = s.course_id;
  UPDATE public.enrollments s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.enrollments x
                      WHERE x.user_id = p_target AND x.course_id = s.course_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('enrollments', v_count);
  DELETE FROM public.enrollments WHERE user_id = p_shell;

  UPDATE public.user_progress t SET
    completed    = COALESCE(t.completed, false) OR COALESCE(s.completed, false),
    completed_at = COALESCE(t.completed_at, s.completed_at),
    tx_signature = COALESCE(t.tx_signature, s.tx_signature),
    lesson_index = COALESCE(t.lesson_index, s.lesson_index)
  FROM public.user_progress s
  WHERE t.user_id = p_target AND s.user_id = p_shell
    AND t.lesson_id = s.lesson_id;
  UPDATE public.user_progress s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.user_progress x
                      WHERE x.user_id = p_target AND x.lesson_id = s.lesson_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('user_progress', v_count);
  DELETE FROM public.user_progress WHERE user_id = p_shell;

  -- user_achievements and certificates carry minted on-chain artifacts
  -- (asset_address, mint_address, tx_signature) — same structural asymmetry
  -- as enrollments: the shell's colliding row is the minted one. Backfill
  -- before dropping (adversarial round 2, R5).
  UPDATE public.user_achievements t SET
    tx_signature  = COALESCE(t.tx_signature, s.tx_signature),
    asset_address = COALESCE(t.asset_address, s.asset_address),
    unlocked_at   = LEAST(t.unlocked_at, s.unlocked_at)
  FROM public.user_achievements s
  WHERE t.user_id = p_target AND s.user_id = p_shell
    AND t.achievement_id = s.achievement_id;
  UPDATE public.user_achievements s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND NOT EXISTS (SELECT 1 FROM public.user_achievements x
                      WHERE x.user_id = p_target AND x.achievement_id = s.achievement_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('user_achievements', v_count);
  DELETE FROM public.user_achievements WHERE user_id = p_shell;

  -- Certificates: idx_certificates_tx_signature_unique is GLOBAL (one row per
  -- signature, not per user), so copying the shell's signature while the
  -- shell's row still exists would collide mid-statement. Delete the shell's
  -- colliding rows FIRST, backfilling the target from each deleted row.
  -- credential_type follows the mint: a target row that never minted adopts
  -- the shell's type along with its mint (else 'core' regresses to the
  -- target's default 'legacy').
  FOR v_cert IN
    DELETE FROM public.certificates s
      WHERE s.user_id = p_shell
        AND EXISTS (SELECT 1 FROM public.certificates x
                    WHERE x.user_id = p_target AND x.course_id = s.course_id)
      RETURNING *
  LOOP
    UPDATE public.certificates t SET
      mint_address    = COALESCE(t.mint_address, v_cert.mint_address),
      metadata_uri    = COALESCE(t.metadata_uri, v_cert.metadata_uri),
      tx_signature    = COALESCE(t.tx_signature, v_cert.tx_signature),
      minted_at       = LEAST(t.minted_at, v_cert.minted_at),
      credential_type = CASE WHEN t.mint_address IS NULL AND v_cert.mint_address IS NOT NULL
                             THEN v_cert.credential_type ELSE t.credential_type END
    WHERE t.user_id = p_target AND t.course_id = v_cert.course_id;
  END LOOP;
  UPDATE public.certificates SET user_id = p_target WHERE user_id = p_shell;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('certificates', v_count);

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

  -- xp_transactions is keyed after all: idx_xp_transactions_idempotency is
  -- UNIQUE (user_id, idempotency_key), and daily-quest keys
  -- (`<questId>:<period>`) are identical across users — both accounts doing
  -- the same quest on the same day WILL collide (adversarial round 2, R4).
  -- The shell's duplicate is the same award already counted once; drop it
  -- (its amount was subtracted from the XP fold above).
  UPDATE public.xp_transactions s SET user_id = p_target
    WHERE s.user_id = p_shell
      AND (s.idempotency_key IS NULL
           OR NOT EXISTS (SELECT 1 FROM public.xp_transactions x
                          WHERE x.user_id = p_target
                            AND x.idempotency_key = s.idempotency_key));
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('xp_transactions', v_count);
  DELETE FROM public.xp_transactions WHERE user_id = p_shell;

  -- ── Unkeyed on author: plain moves, nothing can collide.
  UPDATE public.threads SET author_id = p_target WHERE author_id = p_shell;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('threads', v_count);

  UPDATE public.answers SET author_id = p_target WHERE author_id = p_shell;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('answers', v_count);

  -- Flags carry the same partial per-kind uniques as votes
  -- (idx_flags_unique_thread / idx_flags_unique_answer) — keyed move per
  -- kind, keep the target's flag on a collision (adversarial round 2, R6).
  UPDATE public.flags s SET reporter_id = p_target
    WHERE s.reporter_id = p_shell AND s.thread_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.flags x
                      WHERE x.reporter_id = p_target AND x.thread_id = s.thread_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('thread_flags', v_count);
  UPDATE public.flags s SET reporter_id = p_target
    WHERE s.reporter_id = p_shell AND s.answer_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.flags x
                      WHERE x.reporter_id = p_target AND x.answer_id = s.answer_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('answer_flags', v_count);
  DELETE FROM public.flags WHERE reporter_id = p_shell;
  UPDATE public.flags SET resolved_by = p_target WHERE resolved_by = p_shell;

  -- ── The wallet itself. Shell first (wallet_address is UNIQUE), then target.
  UPDATE public.profiles SET wallet_address = NULL WHERE id = p_shell;
  UPDATE public.profiles SET wallet_address = p_wallet WHERE id = p_target;

  -- Tombstone the shell so no sign-in path can revive it: SIWS no longer
  -- resolves it (wallet nulled) and isAccountDeleted refuses the rest.
  UPDATE public.profiles SET deleted_at = now() WHERE id = p_shell;

  -- ── Fail-closed sweep: every PUBLIC-schema FK into profiles/auth.users
  -- must be clean of the shell. A table this function does not cover aborts
  -- the merge here and rolls everything back. Scoped to the app's own schema
  -- because the shell's auth.users row deliberately survives the merge, and
  -- GoTrue's own tables (auth.identities, auth.sessions, auth.mfa_factors,
  -- auth.one_time_tokens) all FK auth.users — sweeping them would abort every
  -- real merge (adversarial review F1; a shell ALWAYS has an auth.identities
  -- row from admin.createUser).
  FOR v_fk IN
    SELECT c.conrelid::regclass AS tbl, a.attname AS col
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    JOIN LATERAL unnest(c.conkey) AS k(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.contype = 'f'
      AND c.confrelid IN ('public.profiles'::regclass, 'auth.users'::regclass)
      AND c.conrelid <> 'public.profiles'::regclass
      AND ns.nspname = 'public'
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
