-- On-chain retry queue: record every attempt, and make oldest-first selection
-- across all users cheap (#1247).
--
-- Context (prod, 21 Sep 2026): 91 unresolved rows, `retry_count` 0 on all 461
-- rows in the table, 77 `quest_xp_mint` rows up to 29 days old with
-- `last_error` NULL. Nothing was failing — nothing was being attempted. The
-- drain ran only from the three login routes and only for the acting user, and
-- it wrote to the row only on failure, so there was no record of an attempt and
-- no way to back off between them.
--
-- `attempt_count` + `last_attempt_at` are what the drain stamps BEFORE each
-- attempt (see lib/gamification/xp-queue-settlement markAttempt), so an attempt
-- that dies mid-flight still counts and the backoff key is trustworthy.
-- `retry_count` keeps its existing meaning — the failure budget — because "a
-- deferral spends none of it" is a load-bearing invariant (#453 rail 3 / F5).

ALTER TABLE public.pending_onchain_actions
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.pending_onchain_actions.last_attempt_at IS
  'When the drain last STARTED an attempt on this row (stamped before the work, including attempts that end in a deferral). Backoff key: the next attempt is due at last_attempt_at + backoff(retry_count).';

COMMENT ON COLUMN public.pending_onchain_actions.attempt_count IS
  'How many times the drain has STARTED an attempt on this row. Distinct from retry_count, which is the 5-attempt FAILURE budget that deferrals (course maintenance, capstone gate, mint cap, platform freeze, daily XP cap) deliberately do not spend.';

-- The cron drain selects across every user, unresolved, oldest debt first. The
-- existing partial index is keyed on user_id, which the global query cannot
-- use.
CREATE INDEX IF NOT EXISTS idx_pending_onchain_actions_drain
  ON public.pending_onchain_actions (failed_at)
  WHERE resolved_at IS NULL;
