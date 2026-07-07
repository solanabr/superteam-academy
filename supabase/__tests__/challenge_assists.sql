-- Runs inside a transaction and ROLLBACKs, leaving no state behind.
--
-- session_replication_role = 'replica' skips FK checks + triggers for the
-- transaction, so we don't have to satisfy the challenge_assists -> profiles
-- -> auth.users chain (profiles.username is NOT NULL and profiles.id FKs to
-- the Supabase-managed auth.users). The test only exercises the RPC logic, so
-- the FK target is irrelevant here. Requires the postgres/superuser role — the
-- one the Supabase SQL editor and the MCP execute_sql run as.
BEGIN;
SET LOCAL session_replication_role = 'replica';
DO $$
DECLARE u UUID := gen_random_uuid(); r RECORD;
BEGIN
  -- 4 spends allowed (cap = 4)
  FOR i IN 1..4 LOOP
    SELECT * INTO r FROM public.spend_challenge_assist(u, 'lesson-x', 4);
    ASSERT r.allowed = true, format('spend %s should be allowed', i);
    ASSERT r.used = i, format('used should be %s, got %s', i, r.used);
  END LOOP;
  -- 5th denied, count pinned at cap
  SELECT * INTO r FROM public.spend_challenge_assist(u, 'lesson-x', 4);
  ASSERT r.allowed = false, '5th spend must be denied';
  ASSERT r.used = 4, 'count must pin at cap';
  ASSERT public.get_challenge_assists(u, 'lesson-x') = 4, 'getter must read 4';
  -- reset clears it
  PERFORM public.reset_challenge_assists(u, 'lesson-x');
  ASSERT public.get_challenge_assists(u, 'lesson-x') = 0, 'reset must zero it';
  RAISE NOTICE 'challenge_assists: ALL ASSERTIONS PASSED';
END $$;
ROLLBACK;
