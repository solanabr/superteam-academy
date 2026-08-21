-- Allow the `quest_xp_mint` action type on the on-chain retry queue.
--
-- Daily-quest XP is credited DB-side by award_xp (action_type 'quest_xp', Pass 1
-- of retryPendingOnchainActions — wallet-less by design). When the learner has a
-- linked wallet the credit now also enqueues a second row that mints the same XP
-- as soulbound Token-2022 supply and stamps the signature onto the matching
-- xp_transactions row. That second row needs its own action_type, and
-- pending_onchain_actions.action_type is a CHECK-constrained enum, so the list
-- has to be extended before the app can insert one.
--
-- NOTHING ELSE CHANGES: same table, same RLS (unchanged, service_role-only
-- writes), same UNIQUE(user_id, action_type, reference_id) idempotency key. The
-- constraint is only ever widened, so every existing row stays valid and a
-- rollback is safe as long as no quest_xp_mint rows exist yet.

DO $$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT conname
    INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'public.pending_onchain_actions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%action_type%';

  IF v_conname IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.pending_onchain_actions DROP CONSTRAINT %I',
      v_conname
    );
  END IF;
END $$;

ALTER TABLE public.pending_onchain_actions
  ADD CONSTRAINT pending_onchain_actions_action_type_check
  CHECK (action_type IN (
    'achievement',
    'certificate',
    'course_finalize',
    'xp',
    'quest_xp',
    'quest_xp_mint',
    'enroll'
  ));

-- ── Rollback ────────────────────────────────────────────────────────────────
-- ALTER TABLE public.pending_onchain_actions
--   DROP CONSTRAINT pending_onchain_actions_action_type_check;
-- DELETE FROM public.pending_onchain_actions WHERE action_type = 'quest_xp_mint';
-- ALTER TABLE public.pending_onchain_actions
--   ADD CONSTRAINT pending_onchain_actions_action_type_check
--   CHECK (action_type IN ('achievement', 'certificate', 'course_finalize', 'xp', 'quest_xp', 'enroll'));
