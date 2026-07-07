-- Run inside a transaction and ROLLBACK. Uses a throwaway profile id.
BEGIN;
DO $$
DECLARE u UUID := gen_random_uuid(); r RECORD;
BEGIN
  INSERT INTO profiles (id) VALUES (u);
  -- 4 spends allowed (cap = 4)
  FOR i IN 1..4 LOOP
    SELECT * INTO r FROM spend_challenge_assist(u, 'lesson-x', 4);
    ASSERT r.allowed = true, format('spend %s should be allowed', i);
    ASSERT r.used = i, format('used should be %s, got %s', i, r.used);
  END LOOP;
  -- 5th denied, count pinned at cap
  SELECT * INTO r FROM spend_challenge_assist(u, 'lesson-x', 4);
  ASSERT r.allowed = false, '5th spend must be denied';
  ASSERT r.used = 4, 'count must pin at cap';
  ASSERT get_challenge_assists(u, 'lesson-x') = 4, 'getter must read 4';
  -- reset clears it
  PERFORM reset_challenge_assists(u, 'lesson-x');
  ASSERT get_challenge_assists(u, 'lesson-x') = 0, 'reset must zero it';
  RAISE NOTICE 'challenge_assists: ALL ASSERTIONS PASSED';
END $$;
ROLLBACK;
