-- Migration: xp_transactions.source typed column (LX-B9a, #557)
--
-- League scoring (LX-B9b) must filter XP by source — e.g. exclude creator and
-- community XP — instead of parsing free-text reasons. This migration:
--   1. Adds a CHECK-constrained TEXT column `source` to xp_transactions
--      (mirrors the action_type / flags.reason CHECK-IN-list convention).
--   2. Backfills existing rows by reason prefix (mapping below, derived from
--      the actual writers), then sets NOT NULL — safe because the whole file
--      runs in one transaction and ALTER TABLE holds an exclusive lock, so no
--      concurrent insert can slip in a NULL between backfill and NOT NULL.
--   3. Redefines award_xp / award_community_xp (the only two functions that
--      INSERT into xp_transactions) to write `source` on every new row.
--
-- DESIGN — source is DERIVED from p_reason inside award_xp, not threaded as a
-- new parameter through the ~6 TS call sites:
--   * Reason prefixes are already load-bearing machine-readable convention in
--     this schema: award_xp's daily cap counts `reason NOT LIKE 'community:%'`,
--     award_community_xp's cap counts `LIKE 'community:%'`, the dashboard
--     parses `Completed lesson:`, the realtime hook parses `daily_quest:`.
--   * The backfill mapping and the go-forward mapping are the SAME function
--     (xp_source_for_reason below) — one source of truth, so old and new rows
--     can never disagree.
--   * Durable pending_onchain_actions rows already carry reasons in their
--     payloads and may be swept days after this migration applies; derivation
--     keeps them correct with zero migration-before-code-deploy coordination
--     (spec §"Migration serialization order": B9a must be trivial/standalone).
-- award_community_xp hardcodes 'community' — the function IS the community
-- path (all callers pass `community:%` reasons; its 50/day cap assumes it).
--
-- Backfill / derivation mapping (each prefix verified against its writer):
--   reason prefix                 writer                                                        → source
--   'community:%'                 award_community_xp — community routes (thread_created,
--                                 answer_posted, answer_accepted, upvote_thread, upvote_answer) → community
--   'daily_quest:%'               get_daily_quest_state enqueues quest_xp rows with
--                                 memo 'daily_quest:<quest_id>'; swept via award_xp             → quest
--   'Completed lesson:%'          handleLessonCompleted webhook + queued 'xp' action fallback   → lesson
--   'Course completion bonus:%'   handleCourseFinalized bonus XP                                → course_completion
--   'Completed course:%'          queued 'course_finalize' action fallback reason               → course_completion
--   'Creator reward:%'            handleCourseFinalized creator XP                              → creator_reward
--   'Achievement reward:%'        handleAchievementAwarded webhook + admin resync               → achievement
--   anything else                 handleXpRewarded (on-chain reward_xp instruction — arbitrary
--                                 authority-supplied memo, or the 'XP reward' fallback)         → platform
--
-- No 'challenge' or 'streak' value: no writer exists for either today
-- (challenges complete as lessons via on-chain complete_lesson; the dashboard's
-- "Completed challenge:" string is display-only, never written to the table).
-- Values are derived from real call sites, not invented.

-- ── 1. Shared reason→source derivation ───────────────────────
-- Single source of truth for both the backfill below and every future
-- award_xp insert. Pure and IMMUTABLE (no table access; search_path
-- irrelevant). SECURITY INVOKER. Case order matters only for readability —
-- the prefixes are mutually exclusive.
CREATE OR REPLACE FUNCTION public.xp_source_for_reason(p_reason TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_reason LIKE 'community:%'              THEN 'community'
    WHEN p_reason LIKE 'daily_quest:%'            THEN 'quest'
    WHEN p_reason LIKE 'Completed lesson:%'       THEN 'lesson'
    WHEN p_reason LIKE 'Course completion bonus:%' THEN 'course_completion'
    WHEN p_reason LIKE 'Completed course:%'       THEN 'course_completion'
    WHEN p_reason LIKE 'Creator reward:%'         THEN 'creator_reward'
    WHEN p_reason LIKE 'Achievement reward:%'     THEN 'achievement'
    ELSE 'platform'
  END
$$;

-- Not a client RPC — block PostgREST exposure (#377 convention). No
-- service_role grant needed: it is only called from inside the SECURITY
-- DEFINER award functions (which execute as the function owner) and from this
-- migration's backfill.
REVOKE EXECUTE ON FUNCTION public.xp_source_for_reason(TEXT) FROM PUBLIC, anon, authenticated;

-- ── 2. Column + backfill + constraints ───────────────────────

ALTER TABLE public.xp_transactions ADD COLUMN source TEXT;

-- Backfill every existing row by reason prefix (mapping above).
UPDATE public.xp_transactions
SET source = public.xp_source_for_reason(reason);

-- Safe: the backfill just populated every row (xp_source_for_reason never
-- returns NULL — NULL/unknown reasons fall to 'platform'), and this file runs
-- in one transaction under the ADD COLUMN's exclusive lock.
ALTER TABLE public.xp_transactions
  ALTER COLUMN source SET NOT NULL;

ALTER TABLE public.xp_transactions
  ADD CONSTRAINT chk_xp_transactions_source CHECK (source IN (
    'lesson',
    'course_completion',
    'achievement',
    'quest',
    'creator_reward',
    'community',
    'platform'
  ));

-- ── 3. award_xp: write source on every insert ────────────────
-- Verbatim from supabase/schema.sql (last redefined in
-- 20260709130000_award_xp_report_credited.sql) + v_source. Same signature and
-- return type, so CREATE OR REPLACE applies cleanly.
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT DEFAULT NULL,
  p_tx_signature TEXT DEFAULT NULL
) RETURNS INTEGER
-- Returns the amount actually credited (after per-award + daily-cap clamps).
--   > 0 → XP landed (or, for an idempotency-key duplicate, had already landed —
--         the previously-credited amount is returned so callers can treat
--         "already delivered" as delivered).
--   = 0 → nothing was credited (invalid amount, or the daily cap consumed the
--         whole award). Queue-style callers MUST NOT mark delivery resolved
--         on 0 — the credit was dropped, not delivered.
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
  v_new_longest INTEGER;
  v_daily_total INTEGER;
  v_prev_amount INTEGER;
  -- Typed source derived from the reason prefix (LX-B9a) — see
  -- xp_source_for_reason for the mapping and the derivation rationale.
  v_source TEXT;
  -- Hard per-award ceiling. Matches the documented "max 2000 XP per award"
  -- (the largest legitimate single award is a course-completion bonus).
  c_max_award_xp CONSTANT INTEGER := 2000;
  -- Per-user daily ceiling across the learning XP path (lessons, challenges,
  -- bonuses, achievements). Generous enough for normal multi-course days,
  -- low enough to cap a forged-"passed" farming loop.
  c_max_daily_award_xp CONSTANT INTEGER := 5000;
BEGIN
  -- Reject non-positive awards outright (defensive — callers pass positives).
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN 0;
  END IF;

  -- Clamp any single award to the hard ceiling.
  IF p_amount > c_max_award_xp THEN
    p_amount := c_max_award_xp;
  END IF;

  -- Serialize concurrent awards for the same user so the read-then-insert daily
  -- cap below is atomic: without this lock, two parallel awards can both read a
  -- sub-cap total and both insert, blowing past the daily ceiling.
  PERFORM pg_advisory_xact_lock(hashtext('award_xp:' || p_user_id::text)::bigint);

  -- Enforce the per-user daily ceiling. Sum today's learning-path awards
  -- (excluding community XP, which is capped separately) and clamp the credit
  -- so the daily total can never exceed the ceiling. The window boundary is
  -- pinned to UTC midnight so it is independent of the DB session timezone.
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.xp_transactions
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
    AND reason NOT LIKE 'community:%';

  IF v_daily_total >= c_max_daily_award_xp THEN
    RETURN 0;
  END IF;

  IF v_daily_total + p_amount > c_max_daily_award_xp THEN
    p_amount := c_max_daily_award_xp - v_daily_total;
  END IF;

  IF p_amount <= 0 THEN
    RETURN 0;
  END IF;

  v_source := public.xp_source_for_reason(p_reason);

  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.xp_transactions (user_id, amount, reason, source, idempotency_key, tx_signature)
    VALUES (p_user_id, p_amount, p_reason, v_source, p_idempotency_key, p_tx_signature)
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    -- If nothing was inserted (duplicate), skip the XP update too. Report the
    -- previously-credited amount (always > 0 — award_xp never records a
    -- non-positive transaction) so callers see "already delivered", not
    -- "dropped".
    IF NOT FOUND THEN
      SELECT amount INTO v_prev_amount
      FROM public.xp_transactions
      WHERE user_id = p_user_id
        AND idempotency_key = p_idempotency_key;
      RETURN COALESCE(v_prev_amount, 0);
    END IF;
  ELSE
    INSERT INTO public.xp_transactions (user_id, amount, reason, source, tx_signature)
    VALUES (p_user_id, p_amount, p_reason, v_source, p_tx_signature);
  END IF;

  -- Get current streak state before updating
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.user_xp
  WHERE user_id = p_user_id;

  -- Calculate new streak
  IF v_last_activity IS NULL THEN
    -- First activity ever
    v_new_streak := 1;
  ELSIF v_last_activity = CURRENT_DATE THEN
    -- Already active today, keep current streak
    v_new_streak := COALESCE(v_current_streak, 1);
  ELSIF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Active yesterday, increment streak
    v_new_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    -- Gap > 1 day, reset streak
    v_new_streak := 1;
  END IF;

  v_new_longest := GREATEST(COALESCE(v_longest_streak, 0), v_new_streak);

  INSERT INTO public.user_xp (user_id, total_xp, level, last_activity_date, current_streak, longest_streak)
  VALUES (
    p_user_id,
    p_amount,
    floor(sqrt(p_amount / 100.0))::int,
    CURRENT_DATE,
    v_new_streak,
    v_new_longest
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_xp.total_xp + p_amount,
    level = floor(sqrt((user_xp.total_xp + p_amount) / 100.0))::int,
    last_activity_date = CURRENT_DATE,
    current_streak = v_new_streak,
    longest_streak = v_new_longest;

  RETURN p_amount;
END;
$$;

-- Re-apply the service_role-only lockdown (F-06) — defensive re-assert; CREATE
-- OR REPLACE preserves grants, but every award_xp migration re-states them.
REVOKE EXECUTE ON FUNCTION public.award_xp(UUID, INTEGER, TEXT, TEXT, TEXT)
  FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.award_xp(UUID, INTEGER, TEXT, TEXT, TEXT)
  TO service_role;

-- ── 4. award_community_xp: write source='community' ──────────
-- Verbatim from supabase/schema.sql (last redefined in
-- 20260630165536_harden_award_community_xp.sql) + the source column.
CREATE OR REPLACE FUNCTION award_community_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_daily_total INTEGER;
  v_daily_vote_total INTEGER;
  v_is_vote_xp BOOLEAN;
BEGIN
  IF p_amount <= 0 THEN RETURN FALSE; END IF;

  -- Serialize concurrent community awards for the same user so the read-then-
  -- insert daily cap below is atomic (mirrors the lock added to award_xp in
  -- #179). A distinct key namespace avoids contending with award_xp's lock —
  -- the two functions count disjoint xp_transactions rows (community:% vs NOT
  -- community:%), so they need not serialize against each other.
  PERFORM pg_advisory_xact_lock(hashtext('award_community_xp:' || p_user_id::text)::bigint);

  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.xp_transactions
  WHERE user_id = p_user_id
    AND reason LIKE 'community:%'
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

  IF v_daily_total >= 50 THEN RETURN FALSE; END IF;

  v_is_vote_xp := p_reason LIKE 'community:upvote%';
  IF v_is_vote_xp THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_daily_vote_total
    FROM public.xp_transactions
    WHERE user_id = p_user_id
      AND reason LIKE 'community:upvote%'
      AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

    IF v_daily_vote_total >= 10 THEN RETURN FALSE; END IF;

    IF v_daily_vote_total + p_amount > 10 THEN
      p_amount := 10 - v_daily_vote_total;
    END IF;
    IF p_amount <= 0 THEN RETURN FALSE; END IF;
  END IF;

  IF v_daily_total + p_amount > 50 THEN
    p_amount := 50 - v_daily_total;
  END IF;
  IF p_amount <= 0 THEN RETURN FALSE; END IF;

  -- source is hardcoded: this function IS the community XP path (LX-B9a). All
  -- callers pass 'community:%' reasons — the daily-cap accounting above
  -- already depends on that convention.
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.xp_transactions (user_id, amount, reason, source, idempotency_key)
    VALUES (p_user_id, p_amount, p_reason, 'community', p_idempotency_key)
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL
    DO NOTHING;

    IF NOT FOUND THEN RETURN FALSE; END IF;
  ELSE
    INSERT INTO public.xp_transactions (user_id, amount, reason, source)
    VALUES (p_user_id, p_amount, p_reason, 'community');
  END IF;

  INSERT INTO public.user_xp (id, user_id, total_xp, level, current_streak, longest_streak, last_activity_date)
  VALUES (
    gen_random_uuid(), p_user_id, p_amount,
    floor(sqrt(p_amount / 100.0))::int,
    1, 1, CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_xp.total_xp + p_amount,
    level = floor(sqrt((user_xp.total_xp + p_amount) / 100.0))::int,
    last_activity_date = CURRENT_DATE,
    current_streak = CASE
      WHEN user_xp.last_activity_date IS NULL THEN 1
      WHEN user_xp.last_activity_date = CURRENT_DATE THEN user_xp.current_streak
      WHEN user_xp.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_xp.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_xp.longest_streak,
      CASE
        WHEN user_xp.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_xp.current_streak + 1
        WHEN user_xp.last_activity_date = CURRENT_DATE THEN user_xp.current_streak
        ELSE 1
      END
    );

  RETURN TRUE;
END;
$$;

-- Defensive re-assert (mirrors 20260630165536).
REVOKE ALL ON FUNCTION award_community_xp(UUID, INTEGER, TEXT, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION award_community_xp(UUID, INTEGER, TEXT, TEXT) TO service_role;
