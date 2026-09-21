-- Atomic claim for the on-chain retry queue drain (#1255, gate finding 3).
--
-- `markAttempt` was a blind UPDATE, so the 15-minute cron drain and a
-- login-triggered drain could select the same row inside the same second, both
-- pass the action's own existence check (the AchievementReceipt PDA read, the
-- Enrollment credential_asset read) and both send. The chain rejects the loser,
-- so nothing double-mints — but it burns a transaction fee and a retry unit,
-- and the certificate path creates then deletes an `nft_metadata` row on the way
-- out. Making the attempt stamp itself the claim closes the window: exactly one
-- caller gets the row back, the other skips it.
--
-- Also increments `attempt_count` in SQL rather than read-modify-write, so two
-- callers cannot both write the same value.
--
-- The staleness window is a parameter, not a constant, so a stuck claim (a
-- serverless instance killed mid-attempt) is reclaimable: any row whose last
-- attempt is older than the caller's cutoff is claimable again.
CREATE OR REPLACE FUNCTION public.claim_onchain_action(
  p_id           UUID,
  p_stale_before TIMESTAMPTZ
) RETURNS TABLE (id UUID, attempt_count INT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.pending_onchain_actions AS a
     SET attempt_count   = a.attempt_count + 1,
         last_attempt_at = NOW()
   WHERE a.id = p_id
     AND a.resolved_at IS NULL
     AND (a.last_attempt_at IS NULL OR a.last_attempt_at < p_stale_before)
  RETURNING a.id, a.attempt_count;
$$;

-- Drain-only, like every other queue write: never a client RPC (#377
-- convention). service_role alone, called through createAdminClient().
REVOKE EXECUTE ON FUNCTION public.claim_onchain_action(UUID, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_onchain_action(UUID, TIMESTAMPTZ)
  TO service_role;
