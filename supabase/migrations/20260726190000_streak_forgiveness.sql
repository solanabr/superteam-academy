-- ============================================================================
-- Migration: streak forgiveness — ONE coordinated change across every streak
-- writer (LX-B8, #573).
--
-- WHY ONE MIGRATION: three independent code paths compute/persist a streak, and
-- forgiveness must be applied in ALL of them or a frozen streak silently
-- hard-resets down whichever path fires first:
--   1. award_xp                — the learning-XP streak (user_xp.current_streak).
--   2. award_community_xp       — the SAME headline streak, updated from the
--                                 community-XP path (its own `ELSE 1` reset).
--   3. get_daily_quest_state    — the login_streak quest's own per-quest streak
--                                 (user_daily_quests, period_start state machine).
-- lib/gamification/streaks.ts is DISPLAY-ONLY (no state-writing caller) and is
-- updated in the same PR to RENDER freezes, never to consume them.
--
-- MECHANIC (spec §3, LX-B8):
--   * A missed day is CONSUMED from a freeze inventory instead of resetting the
--     streak. Inventory is user_xp.streak_freezes, capped at 2.
--   * Freezes are EARNED server-side via a quest reward (the login_streak quest
--     grants one on completion, capped at 2) — never minted by the client.
--   * Every covered day is logged in streak_freezes_used so the calendar can
--     render a retroactive snowflake, and so the three concurrent writers do NOT
--     double-charge the SAME calendar day (idempotent per (user_id, frozen_date)).
--   * Coverage/consumption is atomic: the decrement is a single guarded UPDATE
--     (row lock + `streak_freezes >= needed`), so no path can over-consume or
--     drive the inventory negative under concurrency.
--
-- The freeze-decision logic is factored into two SECURITY DEFINER helpers
-- (cover_missed_days_with_freezes, next_streak_value) so all three writers share
-- ONE implementation — the "all paths agree" acceptance criterion is structural,
-- not a matter of keeping three copies in sync.
--
-- Idempotent (repo convention): ADD COLUMN / CREATE TABLE / CREATE INDEX IF NOT
-- EXISTS, DROP CONSTRAINT/POLICY IF EXISTS before create, CREATE OR REPLACE
-- functions, ON CONFLICT DO NOTHING logging. Safe to re-apply. Explicit
-- BEGIN/COMMIT so the whole file is one transaction even under a manual psql
-- apply. A tested ROLLBACK block is at the very bottom.
-- Mirrored into supabase/schema.sql (the full-schema snapshot).
--
-- WARNING — TWO-MIGRATION JUMP ON A PRE-170000 DATABASE: this migration's
-- get_daily_quest_state body is built on 20260726170000 (review-quest-kind),
-- so applying it to a database that never ran 170000 (e.g. prod as of
-- 2026-07-27, whose live body predates both review and freeze) ALSO activates
-- the review-quest daily-quest branch — TWO behavioral changes, not just "add
-- streak freezes". Whether that is intended is a deliberate call for the
-- applier. Because of it, the ROLLBACK below is DB-STATE-DEPENDENT for
-- get_daily_quest_state (see step 4), and CREATE OR REPLACE is only reversible
-- if the prior body was captured: BEFORE applying anywhere, snapshot
-- pg_get_functiondef for award_xp, award_community_xp, get_daily_quest_state,
-- and record the step-4 probe (position('review' in prosrc)).
--
-- DEFERRED (documented, out of this PR's acceptance): the weekly-cadence streak
-- mode (spec F32) is gated on owner A/B decision (pedagogy open question #2) and
-- is not part of the LX-B8 acceptance criteria; it is intentionally not built
-- here so forgiveness can ship without waiting on that decision.
-- ============================================================================

BEGIN;

-- ── Freeze inventory (on the existing user_xp row) ──────────────────────────
-- Capped at 2 by CHECK — a safety net beneath the grant path's LEAST(...,2) and
-- the consume path's guarded decrement. Existing rows default to 0 freezes.
ALTER TABLE user_xp ADD COLUMN IF NOT EXISTS streak_freezes INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_xp DROP CONSTRAINT IF EXISTS chk_user_xp_streak_freezes_bounds;
ALTER TABLE user_xp ADD CONSTRAINT chk_user_xp_streak_freezes_bounds
  CHECK (streak_freezes BETWEEN 0 AND 2);

-- ── Consumed-freeze log ─────────────────────────────────────────────────────
-- One row per day a freeze saved. Drives the calendar snowflake AND makes freeze
-- consumption idempotent per calendar day across the three concurrent writers:
-- whichever writer fires first for a given missed day charges the freeze and logs
-- it; the others see it already logged and do not re-charge.
-- Write-side hardening copies the review_items / challenge_assists pattern:
-- RLS on, NO write policy (writes only via the SECURITY DEFINER helpers below),
-- plus an own-row SELECT policy so the client can read its own snowflakes for the
-- calendar (the dashboard is a client surface). anon gets no read.
CREATE TABLE IF NOT EXISTS streak_freezes_used (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  frozen_date DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, frozen_date)
);

ALTER TABLE streak_freezes_used ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own frozen days" ON streak_freezes_used;
CREATE POLICY "Users can view their own frozen days"
  ON streak_freezes_used FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policy: writes go through the SECURITY DEFINER helpers.

-- ── Helper: cover a gap's missed days with freezes (idempotent, atomic) ─────
-- Covers every day in [p_from_date, p_to_date] that is not already frozen.
-- Returns TRUE iff the whole gap is covered (streak survives), FALSE otherwise
-- (streak breaks). Consumes exactly the number of NOT-already-frozen days, in a
-- single guarded UPDATE so a concurrent path cannot push the inventory negative.
CREATE OR REPLACE FUNCTION cover_missed_days_with_freezes(
  p_user_id   UUID,
  p_from_date DATE,
  p_to_date   DATE
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_needed INTEGER;
  v_d      DATE;
BEGIN
  -- No missed days (defensive — callers only invoke this on a real gap).
  IF p_to_date < p_from_date THEN
    RETURN TRUE;
  END IF;

  -- Serialize the freeze decision ACROSS the three streak writers. award_xp and
  -- award_community_xp hold DIFFERENT per-writer advisory locks (and the quest
  -- path holds none), so without this a concurrent pair could both read the
  -- count below before either consumed, and the loser would see 0 freezes,
  -- return FALSE, and spuriously reset a streak while the freeze it needed was
  -- burnt by the winner (snowflake logged, streak reset). A single shared
  -- 'streak:<uid>' lock, taken BEFORE the count, forces the loser to run after
  -- the winner committed: it then sees the day already in streak_freezes_used
  -- (v_needed = 0) and returns TRUE, so both streaks survive on one freeze.
  PERFORM pg_advisory_xact_lock(hashtext('streak:' || p_user_id::text)::bigint);

  -- Count missed days not already covered by a prior freeze. A day another
  -- streak path already froze today does not re-charge a second freeze.
  SELECT COUNT(*) INTO v_needed
  FROM generate_series(p_from_date, p_to_date, INTERVAL '1 day') AS g(d)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.streak_freezes_used sfu
    WHERE sfu.user_id = p_user_id AND sfu.frozen_date = g.d::date
  );

  IF v_needed = 0 THEN
    RETURN TRUE;  -- every missed day already frozen
  END IF;

  -- Consume exactly v_needed freezes atomically. The row lock + `>= v_needed`
  -- guard is the whole concurrency story: two paths cannot both consume the
  -- last freeze, and the inventory can never go negative (nor below the CHECK
  -- floor of 0). A partial cover is impossible — either all needed freezes are
  -- available and consumed, or none are and the streak breaks.
  UPDATE public.user_xp
  SET streak_freezes = streak_freezes - v_needed
  WHERE user_id = p_user_id AND streak_freezes >= v_needed;

  IF NOT FOUND THEN
    RETURN FALSE;  -- not enough freezes — streak breaks
  END IF;

  -- Log each covered day so the calendar renders a snowflake and the other
  -- writers treat it as already frozen (idempotent).
  FOR v_d IN
    SELECT g.d::date FROM generate_series(p_from_date, p_to_date, INTERVAL '1 day') AS g(d)
  LOOP
    INSERT INTO public.streak_freezes_used (user_id, frozen_date)
    VALUES (p_user_id, v_d)
    ON CONFLICT (user_id, frozen_date) DO NOTHING;
  END LOOP;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION cover_missed_days_with_freezes(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION cover_missed_days_with_freezes(UUID, DATE, DATE) TO service_role;

-- ── Helper: the shared headline-streak decision (award_xp + award_community_xp)
-- Encapsulates the full state machine so BOTH XP writers agree by construction:
--   no prior activity      → 1
--   already active today    → keep current
--   active yesterday        → +1
--   gap > 1 day             → +1 if freezes cover the gap, else 1 (reset)
CREATE OR REPLACE FUNCTION next_streak_value(
  p_user_id        UUID,
  p_last_activity  DATE,
  p_current_streak INTEGER,
  p_today          DATE
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
-- The three non-gap branches are byte-faithful to the prior inline logic in
-- award_xp (IS NULL → 1, = today → keep current, = yesterday → +1); only the
-- ELSE (gap > 1 day) branch changes — it now forgives via freezes instead of an
-- unconditional reset. `= p_today` (not `>=`) is deliberate: it preserves the
-- base behavior of resetting on a future last_activity (clock skew), which
-- writers never actually produce since they always stamp CURRENT_DATE.
BEGIN
  IF p_last_activity IS NULL THEN
    RETURN 1;                                    -- first activity ever
  ELSIF p_last_activity = p_today THEN
    RETURN COALESCE(p_current_streak, 1);        -- already active today: keep
  ELSIF p_last_activity = p_today - 1 THEN
    RETURN COALESCE(p_current_streak, 0) + 1;    -- active yesterday: increment
  ELSIF public.cover_missed_days_with_freezes(
          p_user_id, p_last_activity + 1, p_today - 1) THEN
    RETURN COALESCE(p_current_streak, 0) + 1;    -- gap forgiven by freezes
  ELSE
    RETURN 1;                                    -- gap, no freeze: reset
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION next_streak_value(UUID, DATE, INTEGER, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION next_streak_value(UUID, DATE, INTEGER, DATE) TO service_role;

-- ── Grant a freeze (quest reward, capped at 2) ──────────────────────────────
-- Auto-applied server-side when the login_streak quest completes. Upserts the
-- user_xp row so a learner who has not yet earned any XP still banks the freeze;
-- LEAST(...,2) enforces the cap. Returns the new inventory count.
CREATE OR REPLACE FUNCTION grant_streak_freeze(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.user_xp (user_id, streak_freezes)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    streak_freezes = LEAST(user_xp.streak_freezes + 1, 2)
  RETURNING streak_freezes INTO v_count;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION grant_streak_freeze(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION grant_streak_freeze(UUID) TO service_role;

-- ── Writer 1: award_xp — streak decision delegated to next_streak_value ─────
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT DEFAULT NULL,
  p_tx_signature TEXT DEFAULT NULL
) RETURNS INTEGER
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
  v_source TEXT;
  c_max_award_xp CONSTANT INTEGER := 2000;
  c_max_daily_award_xp CONSTANT INTEGER := 5000;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN 0;
  END IF;

  IF p_amount > c_max_award_xp THEN
    p_amount := c_max_award_xp;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('award_xp:' || p_user_id::text)::bigint);

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

  -- Get current streak state, then apply the shared forgiveness-aware decision.
  -- next_streak_value consumes freezes (and logs frozen days) on a forgiven gap
  -- BEFORE the upsert below writes the surviving streak — same row, one txn.
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.user_xp
  WHERE user_id = p_user_id;

  v_new_streak := public.next_streak_value(p_user_id, v_last_activity, v_current_streak, CURRENT_DATE);
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

REVOKE EXECUTE ON FUNCTION award_xp FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION award_xp TO service_role;

-- ── Writer 2: award_community_xp — same shared streak decision ──────────────
-- The prior inline `ELSE 1` in the ON CONFLICT CASE hard-reset a frozen streak
-- whenever community XP was the day's first write. Now it reads the streak state
-- and defers to next_streak_value, exactly like award_xp.
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
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
  v_new_longest INTEGER;
BEGIN
  IF p_amount <= 0 THEN RETURN FALSE; END IF;

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

  -- Shared forgiveness-aware streak decision (identical rail to award_xp).
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.user_xp
  WHERE user_id = p_user_id;

  v_new_streak := public.next_streak_value(p_user_id, v_last_activity, v_current_streak, CURRENT_DATE);
  v_new_longest := GREATEST(COALESCE(v_longest_streak, 0), v_new_streak);

  INSERT INTO public.user_xp (id, user_id, total_xp, level, current_streak, longest_streak, last_activity_date)
  VALUES (
    gen_random_uuid(), p_user_id, p_amount,
    floor(sqrt(p_amount / 100.0))::int,
    v_new_streak, v_new_longest, CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_xp.total_xp + p_amount,
    level = floor(sqrt((user_xp.total_xp + p_amount) / 100.0))::int,
    last_activity_date = CURRENT_DATE,
    current_streak = v_new_streak,
    longest_streak = v_new_longest;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION award_community_xp(UUID, INTEGER, TEXT, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION award_community_xp(UUID, INTEGER, TEXT, TEXT) TO service_role;

-- ── Writer 3: get_daily_quest_state — login_streak gap forgiveness + grant ──
-- Only the login_streak branch changes: Case 3 (gap) now defers to
-- cover_missed_days_with_freezes before breaking the quest streak, and first
-- completion grants a freeze (the quest reward that funds the mechanic). Every
-- other quest type is byte-identical to the prior definition.
CREATE OR REPLACE FUNCTION get_daily_quest_state(
  p_user_id           UUID,
  p_quest_definitions JSONB,
  p_challenge_ids     TEXT[],
  p_module_lesson_map JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_quest        JSONB;
  v_quest_id     TEXT;
  v_type         TEXT;
  v_target       INTEGER;
  v_xp           INTEGER;
  v_reset_type   TEXT;
  v_current      INTEGER;
  v_period       DATE;
  v_existing     RECORD;
  v_results      JSONB := '[]'::JSONB;
  v_mod          JSONB;
  v_mod_lessons  TEXT[];
  v_all_done     BOOLEAN;
  v_max_date     DATE;
  v_just_awarded BOOLEAN;
  v_completed    BOOLEAN;
BEGIN
  FOR v_quest IN SELECT * FROM jsonb_array_elements(p_quest_definitions)
  LOOP
    v_quest_id   := v_quest->>'id';
    v_type       := v_quest->>'type';
    v_target     := (v_quest->>'targetValue')::INTEGER;
    v_xp         := (v_quest->>'xpReward')::INTEGER;
    v_reset_type := v_quest->>'resetType';
    v_current    := 0;
    v_just_awarded := false;

    IF v_type = 'lesson' OR v_type = 'lesson_batch' THEN
      SELECT COUNT(*)::INTEGER INTO v_current
      FROM public.user_progress
      WHERE user_id = p_user_id
        AND completed = true
        AND completed_at::date = CURRENT_DATE;

    ELSIF v_type = 'challenge' THEN
      SELECT COUNT(*)::INTEGER INTO v_current
      FROM public.user_progress
      WHERE user_id = p_user_id
        AND completed = true
        AND completed_at::date = CURRENT_DATE
        AND lesson_id = ANY(p_challenge_ids);

    ELSIF v_type = 'login_streak' THEN
      -- Dashboard load = login signal.
      SELECT * INTO v_existing
      FROM public.user_daily_quests
      WHERE user_id = p_user_id
        AND quest_id = v_quest_id
        AND completed = false
      ORDER BY period_start DESC
      LIMIT 1;

      -- Three-case state machine (see the diff walkthrough below). Case 3 (gap)
      -- now consults streak freezes before breaking the quest streak, so a
      -- forgiven gap keeps the quest streak alive exactly as it keeps the
      -- headline streak alive — the two agree by using the same freeze log.
      --   Day 1 created:       period_start=D1, current_value=1, diff=0
      --   Day 2 first load:    diff=1, cv=1 → increment to 2
      --   Day 3 first load:    diff=2, cv=2 → increment to 3 → COMPLETE
      --   Day 5 (skipped D4):  diff=4, cv=3 → gap; forgiven iff D4 is covered
      IF v_existing IS NULL THEN
        v_current := 1;
        v_period  := CURRENT_DATE;

      ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value - 1 THEN
        -- Already counted today (idempotent reload) — no-op.
        v_current := v_existing.current_value;
        v_period  := v_existing.period_start;

      ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value THEN
        -- Unbroken streak, new day — increment.
        v_current := v_existing.current_value + 1;
        v_period  := v_existing.period_start;

      ELSIF public.cover_missed_days_with_freezes(
              p_user_id,
              v_existing.period_start + v_existing.current_value,
              CURRENT_DATE - 1) THEN
        -- Case 3a: gap, but freezes cover every missed day — streak survives and
        -- today's login increments it. Missed days run from the first uncounted
        -- day (period_start + current_value) through yesterday.
        v_current := v_existing.current_value + 1;
        v_period  := v_existing.period_start;

      ELSE
        -- Case 3b: gap with no freeze — streak breaks, start fresh today.
        v_current := 1;
        v_period  := CURRENT_DATE;
      END IF;

      v_completed := v_target > 0 AND v_current >= v_target;

      INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
      VALUES (p_user_id, v_quest_id, v_current, v_completed, CASE WHEN v_completed THEN NOW() ELSE NULL END, false, v_period)
      ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        completed     = EXCLUDED.completed,
        completed_at  = EXCLUDED.completed_at;

      IF v_completed THEN
        UPDATE public.user_daily_quests
        SET xp_granted = true
        WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;

        IF FOUND THEN
          v_just_awarded := true;
          INSERT INTO public.pending_onchain_actions (user_id, action_type, reference_id, payload)
          VALUES (
            p_user_id,
            'quest_xp',
            v_quest_id || ':' || v_period::text,
            jsonb_build_object('xpAmount', v_xp, 'memo', 'daily_quest:' || v_quest_id)
          )
          ON CONFLICT (user_id, action_type, reference_id) DO NOTHING;

          -- Quest reward that funds forgiveness: completing the consistency quest
          -- banks a freeze (capped at 2, server-side). Granted alongside the XP
          -- enqueue on first completion only (guarded by the xp_granted flip).
          PERFORM public.grant_streak_freeze(p_user_id);
        END IF;
      END IF;

      v_results := v_results || jsonb_build_object(
        'questId', v_quest_id,
        'currentValue', v_current,
        'completed', v_completed,
        'justAwarded', v_just_awarded,
        'xpReward', v_xp
      );
      CONTINUE;

    ELSIF v_type = 'module' THEN
      v_current := 0;
      FOR v_mod IN SELECT * FROM jsonb_array_elements(p_module_lesson_map)
      LOOP
        v_mod_lessons := ARRAY(SELECT jsonb_array_elements_text(v_mod->'lessonIds'));
        IF array_length(v_mod_lessons, 1) IS NULL OR array_length(v_mod_lessons, 1) = 0 THEN
          CONTINUE;
        END IF;

        SELECT COUNT(*) = array_length(v_mod_lessons, 1) INTO v_all_done
        FROM public.user_progress
        WHERE user_id = p_user_id
          AND completed = true
          AND lesson_id = ANY(v_mod_lessons);

        IF v_all_done THEN
          SELECT MAX(completed_at::date) INTO v_max_date
          FROM public.user_progress
          WHERE user_id = p_user_id
            AND completed = true
            AND lesson_id = ANY(v_mod_lessons);

          IF v_max_date = CURRENT_DATE THEN
            v_current := 1;
            EXIT;
          END IF;
        END IF;
      END LOOP;

    ELSIF v_type = 'review' THEN
      SELECT COUNT(*)::INTEGER INTO v_current
      FROM public.review_items
      WHERE user_id = p_user_id
        AND last_result = true
        AND last_reviewed_at::date = CURRENT_DATE;

    ELSE
      RAISE WARNING 'get_daily_quest_state: skipping unknown quest type: %', v_type;
      CONTINUE;
    END IF;

    -- ── Generic daily quest upsert (lesson, lesson_batch, challenge, module) ──
    v_period := CURRENT_DATE;

    v_completed := v_target > 0 AND v_current >= v_target;

    INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
    VALUES (p_user_id, v_quest_id, v_current, v_completed, CASE WHEN v_completed THEN NOW() ELSE NULL END, false, v_period)
    ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
      current_value = EXCLUDED.current_value,
      completed     = EXCLUDED.completed,
      completed_at  = COALESCE(user_daily_quests.completed_at, EXCLUDED.completed_at);

    IF v_completed THEN
      UPDATE public.user_daily_quests
      SET xp_granted = true
      WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;

      IF FOUND THEN
        v_just_awarded := true;
        INSERT INTO public.pending_onchain_actions (user_id, action_type, reference_id, payload)
        VALUES (
          p_user_id,
          'quest_xp',
          v_quest_id || ':' || v_period::text,
          jsonb_build_object('xpAmount', v_xp, 'memo', 'daily_quest:' || v_quest_id)
        )
        ON CONFLICT (user_id, action_type, reference_id) DO NOTHING;
      END IF;
    END IF;

    v_results := v_results || jsonb_build_object(
      'questId', v_quest_id,
      'currentValue', v_current,
      'completed', v_completed,
      'justAwarded', v_just_awarded,
      'xpReward', v_xp
    );
  END LOOP;

  RETURN v_results;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_daily_quest_state FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION get_daily_quest_state TO service_role;

COMMIT;

-- ============================================================================
-- ROLLBACK — restores the pre-forgiveness state. Steps 1-3 are unconditional
-- (drop the new objects; restore award_xp / award_community_xp verbatim). Step
-- 4 (get_daily_quest_state) is DB-STATE-DEPENDENT: its correct prior body differs
-- by whether 20260726170000 had been applied to THIS database, so it is NOT a
-- single verbatim restore — see step 4. CREATE OR REPLACE is only reversible if
-- the prior body was snapshotted first (see the header warning). Run as one txn:
-- ----------------------------------------------------------------------------
-- BEGIN;
--
-- -- 1. Drop the new helper/grant functions and the freeze log + column.
-- DROP FUNCTION IF EXISTS public.grant_streak_freeze(UUID);
-- DROP FUNCTION IF EXISTS public.next_streak_value(UUID, DATE, INTEGER, DATE);
-- DROP FUNCTION IF EXISTS public.cover_missed_days_with_freezes(UUID, DATE, DATE);
-- DROP TABLE IF EXISTS public.streak_freezes_used;   -- drops its own-row policy
-- ALTER TABLE public.user_xp DROP CONSTRAINT IF EXISTS chk_user_xp_streak_freezes_bounds;
-- ALTER TABLE public.user_xp DROP COLUMN IF EXISTS streak_freezes;
--
-- -- 2. Restore award_xp to its pre-forgiveness body (inline gap → reset to 1).
-- CREATE OR REPLACE FUNCTION award_xp(
--   p_user_id UUID, p_amount INTEGER, p_reason TEXT,
--   p_idempotency_key TEXT DEFAULT NULL, p_tx_signature TEXT DEFAULT NULL
-- ) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
-- DECLARE
--   v_last_activity DATE; v_current_streak INTEGER; v_longest_streak INTEGER;
--   v_new_streak INTEGER; v_new_longest INTEGER; v_daily_total INTEGER;
--   v_prev_amount INTEGER; v_source TEXT;
--   c_max_award_xp CONSTANT INTEGER := 2000;
--   c_max_daily_award_xp CONSTANT INTEGER := 5000;
-- BEGIN
--   IF p_amount IS NULL OR p_amount <= 0 THEN RETURN 0; END IF;
--   IF p_amount > c_max_award_xp THEN p_amount := c_max_award_xp; END IF;
--   PERFORM pg_advisory_xact_lock(hashtext('award_xp:' || p_user_id::text)::bigint);
--   SELECT COALESCE(SUM(amount), 0) INTO v_daily_total FROM public.xp_transactions
--     WHERE user_id = p_user_id
--       AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
--       AND reason NOT LIKE 'community:%';
--   IF v_daily_total >= c_max_daily_award_xp THEN RETURN 0; END IF;
--   IF v_daily_total + p_amount > c_max_daily_award_xp THEN p_amount := c_max_daily_award_xp - v_daily_total; END IF;
--   IF p_amount <= 0 THEN RETURN 0; END IF;
--   v_source := public.xp_source_for_reason(p_reason);
--   IF p_idempotency_key IS NOT NULL THEN
--     INSERT INTO public.xp_transactions (user_id, amount, reason, source, idempotency_key, tx_signature)
--     VALUES (p_user_id, p_amount, p_reason, v_source, p_idempotency_key, p_tx_signature)
--     ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
--     IF NOT FOUND THEN
--       SELECT amount INTO v_prev_amount FROM public.xp_transactions
--         WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
--       RETURN COALESCE(v_prev_amount, 0);
--     END IF;
--   ELSE
--     INSERT INTO public.xp_transactions (user_id, amount, reason, source, tx_signature)
--     VALUES (p_user_id, p_amount, p_reason, v_source, p_tx_signature);
--   END IF;
--   SELECT last_activity_date, current_streak, longest_streak
--     INTO v_last_activity, v_current_streak, v_longest_streak
--     FROM public.user_xp WHERE user_id = p_user_id;
--   IF v_last_activity IS NULL THEN v_new_streak := 1;
--   ELSIF v_last_activity = CURRENT_DATE THEN v_new_streak := COALESCE(v_current_streak, 1);
--   ELSIF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN v_new_streak := COALESCE(v_current_streak, 0) + 1;
--   ELSE v_new_streak := 1; END IF;
--   v_new_longest := GREATEST(COALESCE(v_longest_streak, 0), v_new_streak);
--   INSERT INTO public.user_xp (user_id, total_xp, level, last_activity_date, current_streak, longest_streak)
--   VALUES (p_user_id, p_amount, floor(sqrt(p_amount / 100.0))::int, CURRENT_DATE, v_new_streak, v_new_longest)
--   ON CONFLICT (user_id) DO UPDATE SET
--     total_xp = user_xp.total_xp + p_amount,
--     level = floor(sqrt((user_xp.total_xp + p_amount) / 100.0))::int,
--     last_activity_date = CURRENT_DATE, current_streak = v_new_streak, longest_streak = v_new_longest;
--   RETURN p_amount;
-- END; $$;
-- REVOKE EXECUTE ON FUNCTION award_xp FROM authenticated, anon, public;
-- GRANT EXECUTE ON FUNCTION award_xp TO service_role;
--
-- -- 3. Restore award_community_xp to its pre-forgiveness body (inline CASE reset).
-- CREATE OR REPLACE FUNCTION award_community_xp(
--   p_user_id UUID, p_amount INTEGER, p_reason TEXT, p_idempotency_key TEXT DEFAULT NULL
-- ) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
-- DECLARE v_daily_total INTEGER; v_daily_vote_total INTEGER; v_is_vote_xp BOOLEAN;
-- BEGIN
--   IF p_amount <= 0 THEN RETURN FALSE; END IF;
--   PERFORM pg_advisory_xact_lock(hashtext('award_community_xp:' || p_user_id::text)::bigint);
--   SELECT COALESCE(SUM(amount), 0) INTO v_daily_total FROM public.xp_transactions
--     WHERE user_id = p_user_id AND reason LIKE 'community:%'
--       AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
--   IF v_daily_total >= 50 THEN RETURN FALSE; END IF;
--   v_is_vote_xp := p_reason LIKE 'community:upvote%';
--   IF v_is_vote_xp THEN
--     SELECT COALESCE(SUM(amount), 0) INTO v_daily_vote_total FROM public.xp_transactions
--       WHERE user_id = p_user_id AND reason LIKE 'community:upvote%'
--         AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
--     IF v_daily_vote_total >= 10 THEN RETURN FALSE; END IF;
--     IF v_daily_vote_total + p_amount > 10 THEN p_amount := 10 - v_daily_vote_total; END IF;
--     IF p_amount <= 0 THEN RETURN FALSE; END IF;
--   END IF;
--   IF v_daily_total + p_amount > 50 THEN p_amount := 50 - v_daily_total; END IF;
--   IF p_amount <= 0 THEN RETURN FALSE; END IF;
--   IF p_idempotency_key IS NOT NULL THEN
--     INSERT INTO public.xp_transactions (user_id, amount, reason, source, idempotency_key)
--     VALUES (p_user_id, p_amount, p_reason, 'community', p_idempotency_key)
--     ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
--     IF NOT FOUND THEN RETURN FALSE; END IF;
--   ELSE
--     INSERT INTO public.xp_transactions (user_id, amount, reason, source)
--     VALUES (p_user_id, p_amount, p_reason, 'community');
--   END IF;
--   INSERT INTO public.user_xp (id, user_id, total_xp, level, current_streak, longest_streak, last_activity_date)
--   VALUES (gen_random_uuid(), p_user_id, p_amount, floor(sqrt(p_amount / 100.0))::int, 1, 1, CURRENT_DATE)
--   ON CONFLICT (user_id) DO UPDATE SET
--     total_xp = user_xp.total_xp + p_amount,
--     level = floor(sqrt((user_xp.total_xp + p_amount) / 100.0))::int,
--     last_activity_date = CURRENT_DATE,
--     current_streak = CASE
--       WHEN user_xp.last_activity_date IS NULL THEN 1
--       WHEN user_xp.last_activity_date = CURRENT_DATE THEN user_xp.current_streak
--       WHEN user_xp.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_xp.current_streak + 1
--       ELSE 1 END,
--     longest_streak = GREATEST(user_xp.longest_streak, CASE
--       WHEN user_xp.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_xp.current_streak + 1
--       WHEN user_xp.last_activity_date = CURRENT_DATE THEN user_xp.current_streak
--       ELSE 1 END);
--   RETURN TRUE;
-- END; $$;
-- REVOKE ALL ON FUNCTION award_community_xp(UUID, INTEGER, TEXT, TEXT) FROM public, anon, authenticated;
-- GRANT EXECUTE ON FUNCTION award_community_xp(UUID, INTEGER, TEXT, TEXT) TO service_role;
--
-- -- 4. Restore get_daily_quest_state. UNLIKE steps 2-3, the correct prior body
-- --    is NOT fixed: it depends on whether 20260726170000 (review-quest-kind)
-- --    had been applied to THIS database before 190000. Determine which with the
-- --    probe below, run BEFORE applying 190000 (afterwards the live body is
-- --    190000's own and can no longer tell you which prior state you were in):
--
--   SELECT position('review' in prosrc) > 0 AS had_review_branch
--   FROM pg_proc WHERE proname = 'get_daily_quest_state';
--
-- --    PREFERRED: if before applying you captured
-- --      pg_get_functiondef('public.get_daily_quest_state(UUID, JSONB, TEXT[], JSONB)'::regprocedure)
-- --    (see the header warning), restore THAT verbatim and skip 4a/4b — it is
-- --    exact by construction. Otherwise pick the fork below from had_review_branch:
--
-- -- 4a. had_review_branch = TRUE — 170000 WAS applied. Restore its body
-- --     (review branch, original login_streak Case-3 reset, NO freeze grant),
-- --     copied verbatim from 20260726170000_review_quest_kind.sql:
-- CREATE OR REPLACE FUNCTION get_daily_quest_state(
--   p_user_id           UUID,
--   p_quest_definitions JSONB,
--   p_challenge_ids     TEXT[],
--   p_module_lesson_map JSONB
-- ) RETURNS JSONB
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- DECLARE
--   v_quest        JSONB;
--   v_quest_id     TEXT;
--   v_type         TEXT;
--   v_target       INTEGER;
--   v_xp           INTEGER;
--   v_reset_type   TEXT;
--   v_current      INTEGER;
--   v_period       DATE;
--   v_existing     RECORD;
--   v_results      JSONB := '[]'::JSONB;
--   v_mod          JSONB;
--   v_mod_lessons  TEXT[];
--   v_all_done     BOOLEAN;
--   v_max_date     DATE;
--   v_just_awarded BOOLEAN;
--   v_completed    BOOLEAN;
-- BEGIN
--   FOR v_quest IN SELECT * FROM jsonb_array_elements(p_quest_definitions)
--   LOOP
--     v_quest_id   := v_quest->>'id';
--     v_type       := v_quest->>'type';
--     v_target     := (v_quest->>'targetValue')::INTEGER;
--     v_xp         := (v_quest->>'xpReward')::INTEGER;
--     v_reset_type := v_quest->>'resetType';
--     v_current    := 0;
--     v_just_awarded := false;
--
--     -- ── Calculate current_value per quest type ──
--     IF v_type = 'lesson' OR v_type = 'lesson_batch' THEN
--       SELECT COUNT(*)::INTEGER INTO v_current
--       FROM public.user_progress
--       WHERE user_id = p_user_id
--         AND completed = true
--         AND completed_at::date = CURRENT_DATE;
--
--     ELSIF v_type = 'challenge' THEN
--       SELECT COUNT(*)::INTEGER INTO v_current
--       FROM public.user_progress
--       WHERE user_id = p_user_id
--         AND completed = true
--         AND completed_at::date = CURRENT_DATE
--         AND lesson_id = ANY(p_challenge_ids);
--
--     ELSIF v_type = 'login_streak' THEN
--       -- Dashboard load = login signal.
--       -- Find the most recent active (non-completed) streak row for this quest.
--       SELECT * INTO v_existing
--       FROM public.user_daily_quests
--       WHERE user_id = p_user_id
--         AND quest_id = v_quest_id
--         AND completed = false
--       ORDER BY period_start DESC
--       LIMIT 1;
--
--       -- Three-case state machine for login streaks.
--       -- Let diff = CURRENT_DATE - period_start (days since streak started).
--       --
--       -- Walkthrough (target = 3):
--       --   Day 1 created:       period_start=D1, current_value=1, diff=0
--       --   Day 1 reload:        diff=0, cv=1 → diff = cv-1 (0=0) → no-op ✓
--       --   Day 2 first load:    diff=1, cv=1 → diff = cv   (1=1) → increment to 2 ✓
--       --   Day 2 reload:        diff=1, cv=2 → diff = cv-1 (1=1) → no-op ✓
--       --   Day 3 first load:    diff=2, cv=2 → diff = cv   (2=2) → increment to 3 → COMPLETE ✓
--       --   Day 5 (skipped D4):  diff=4, cv=3 → diff > cv   (4>3) → gap, start new ✓
--
--       IF v_existing IS NULL THEN
--         -- Case 0: No active streak row — start fresh
--         v_current := 1;
--         v_period  := CURRENT_DATE;
--
--       ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value - 1 THEN
--         -- Case 1: Already counted today (idempotent reload) — no-op
--         -- diff = cv-1 means today is the same day as the last increment
--         v_current := v_existing.current_value;
--         v_period  := v_existing.period_start;
--
--       ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value THEN
--         -- Case 2: Unbroken streak, new day — increment
--         -- diff = cv means yesterday was the last counted day
--         v_current := v_existing.current_value + 1;
--         v_period  := v_existing.period_start;
--
--       ELSE
--         -- Case 3: diff > cv — gap detected, streak broken, start new
--         v_current := 1;
--         v_period  := CURRENT_DATE;
--       END IF;
--
--       -- Completion requires a positive target: a targetValue of 0 must NOT
--       -- auto-complete (that would mint free XP every day for a 0-target quest).
--       v_completed := v_target > 0 AND v_current >= v_target;
--
--       -- Upsert the streak row and skip the generic upsert below
--       INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
--       VALUES (p_user_id, v_quest_id, v_current, v_completed, CASE WHEN v_completed THEN NOW() ELSE NULL END, false, v_period)
--       ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
--         current_value = EXCLUDED.current_value,
--         completed     = EXCLUDED.completed,
--         completed_at  = EXCLUDED.completed_at;
--
--       -- Mark xp_granted on first completion and durably enqueue the XP credit
--       -- in the SAME transaction (atomic with the flip): a quest is never marked
--       -- granted without a pending_onchain_actions row, so the enqueue can never
--       -- be lost to a swallowed app-side error. retryPendingOnchainActions()
--       -- delivers it idempotently via award_xp (reference_id = idempotency key).
--       IF v_completed THEN
--         UPDATE public.user_daily_quests
--         SET xp_granted = true
--         WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;
--
--         IF FOUND THEN
--           v_just_awarded := true;
--           INSERT INTO public.pending_onchain_actions (user_id, action_type, reference_id, payload)
--           VALUES (
--             p_user_id,
--             'quest_xp',
--             v_quest_id || ':' || v_period::text,
--             jsonb_build_object('xpAmount', v_xp, 'memo', 'daily_quest:' || v_quest_id)
--           )
--           ON CONFLICT (user_id, action_type, reference_id) DO NOTHING;
--         END IF;
--       END IF;
--
--       v_results := v_results || jsonb_build_object(
--         'questId', v_quest_id,
--         'currentValue', v_current,
--         'completed', v_completed,
--         'justAwarded', v_just_awarded,
--         'xpReward', v_xp
--       );
--       CONTINUE;  -- Skip generic upsert
--
--     ELSIF v_type = 'module' THEN
--       -- Check if ALL lessons in ANY module are completed AND the last one was completed today
--       v_current := 0;
--       FOR v_mod IN SELECT * FROM jsonb_array_elements(p_module_lesson_map)
--       LOOP
--         v_mod_lessons := ARRAY(SELECT jsonb_array_elements_text(v_mod->'lessonIds'));
--         IF array_length(v_mod_lessons, 1) IS NULL OR array_length(v_mod_lessons, 1) = 0 THEN
--           CONTINUE;
--         END IF;
--
--         -- Check all lessons completed
--         SELECT COUNT(*) = array_length(v_mod_lessons, 1) INTO v_all_done
--         FROM public.user_progress
--         WHERE user_id = p_user_id
--           AND completed = true
--           AND lesson_id = ANY(v_mod_lessons);
--
--         IF v_all_done THEN
--           -- Check if the most recent completion in this module was today
--           SELECT MAX(completed_at::date) INTO v_max_date
--           FROM public.user_progress
--           WHERE user_id = p_user_id
--             AND completed = true
--             AND lesson_id = ANY(v_mod_lessons);
--
--           IF v_max_date = CURRENT_DATE THEN
--             v_current := 1;
--             EXIT;  -- One completed module is enough
--           END IF;
--         END IF;
--       END LOOP;
--
--     ELSIF v_type = 'review' THEN
--       -- Reviews CLEARED today = the learner's own review_items passed today.
--       -- A pass advances the item's spacing box (record_review_result); a miss
--       -- resets it to box 1 with last_result=false, which is NOT a clear and so
--       -- must not count. Additive branch: it only computes v_current and falls
--       -- through to the generic upsert below, so the xp_granted /
--       -- pending_onchain_actions atomicity invariant is inherited unchanged and
--       -- no other quest type is affected.
--       SELECT COUNT(*)::INTEGER INTO v_current
--       FROM public.review_items
--       WHERE user_id = p_user_id
--         AND last_result = true
--         AND last_reviewed_at::date = CURRENT_DATE;
--
--     ELSE
--       -- Unknown quest type (e.g. a CMS typo). Skip this ONE quest with a loud
--       -- server-log warning rather than RAISE-ing — a single mis-typed quest
--       -- definition must not 500 the whole daily-quests endpoint for every user
--       -- (and, now that the enqueue is transactional, roll back other quests'
--       -- durable XP rows in the same call). It is not rendered as a silent 0/N:
--       -- it is omitted from the result and flagged in the logs for the operator.
--       RAISE WARNING 'get_daily_quest_state: skipping unknown quest type: %', v_type;
--       CONTINUE;
--     END IF;
--
--     -- ── Generic daily quest upsert (lesson, lesson_batch, challenge, module) ──
--     v_period := CURRENT_DATE;
--
--     -- Completion requires a positive target: a targetValue of 0 must NOT
--     -- auto-complete (that would mint free XP every day for a 0-target quest).
--     v_completed := v_target > 0 AND v_current >= v_target;
--
--     INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
--     VALUES (p_user_id, v_quest_id, v_current, v_completed, CASE WHEN v_completed THEN NOW() ELSE NULL END, false, v_period)
--     ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
--       current_value = EXCLUDED.current_value,
--       completed     = EXCLUDED.completed,
--       completed_at  = COALESCE(user_daily_quests.completed_at, EXCLUDED.completed_at);
--
--     -- Mark xp_granted on first completion and durably enqueue the XP credit in
--     -- the SAME transaction (atomic with the flip) — see the login_streak branch.
--     IF v_completed THEN
--       UPDATE public.user_daily_quests
--       SET xp_granted = true
--       WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;
--
--       IF FOUND THEN
--         v_just_awarded := true;
--         INSERT INTO public.pending_onchain_actions (user_id, action_type, reference_id, payload)
--         VALUES (
--           p_user_id,
--           'quest_xp',
--           v_quest_id || ':' || v_period::text,
--           jsonb_build_object('xpAmount', v_xp, 'memo', 'daily_quest:' || v_quest_id)
--         )
--         ON CONFLICT (user_id, action_type, reference_id) DO NOTHING;
--       END IF;
--     END IF;
--
--     v_results := v_results || jsonb_build_object(
--       'questId', v_quest_id,
--       'currentValue', v_current,
--       'completed', v_completed,
--       'justAwarded', v_just_awarded,
--       'xpReward', v_xp
--     );
--   END LOOP;
--
--   RETURN v_results;
-- END;
-- $$;
--
-- REVOKE EXECUTE ON FUNCTION get_daily_quest_state FROM authenticated, anon, public;
-- GRANT EXECUTE ON FUNCTION get_daily_quest_state TO service_role;
--
-- -- 4b. had_review_branch = FALSE — 170000 was NOT applied (current prod). Restore
-- --     the body that preceded it (NEITHER review nor freeze), copied verbatim
-- --     from 20260709120000_quest_xp_durable_delivery.sql:
-- CREATE OR REPLACE FUNCTION get_daily_quest_state(
--   p_user_id           UUID,
--   p_quest_definitions JSONB,
--   p_challenge_ids     TEXT[],
--   p_module_lesson_map JSONB
-- ) RETURNS JSONB
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = ''
-- AS $$
-- DECLARE
--   v_quest        JSONB;
--   v_quest_id     TEXT;
--   v_type         TEXT;
--   v_target       INTEGER;
--   v_xp           INTEGER;
--   v_reset_type   TEXT;
--   v_current      INTEGER;
--   v_period       DATE;
--   v_existing     RECORD;
--   v_results      JSONB := '[]'::JSONB;
--   v_mod          JSONB;
--   v_mod_lessons  TEXT[];
--   v_all_done     BOOLEAN;
--   v_max_date     DATE;
--   v_just_awarded BOOLEAN;
--   v_completed    BOOLEAN;
-- BEGIN
--   FOR v_quest IN SELECT * FROM jsonb_array_elements(p_quest_definitions)
--   LOOP
--     v_quest_id   := v_quest->>'id';
--     v_type       := v_quest->>'type';
--     v_target     := (v_quest->>'targetValue')::INTEGER;
--     v_xp         := (v_quest->>'xpReward')::INTEGER;
--     v_reset_type := v_quest->>'resetType';
--     v_current    := 0;
--     v_just_awarded := false;
--
--     -- ── Calculate current_value per quest type ──
--     IF v_type = 'lesson' OR v_type = 'lesson_batch' THEN
--       SELECT COUNT(*)::INTEGER INTO v_current
--       FROM public.user_progress
--       WHERE user_id = p_user_id
--         AND completed = true
--         AND completed_at::date = CURRENT_DATE;
--
--     ELSIF v_type = 'challenge' THEN
--       SELECT COUNT(*)::INTEGER INTO v_current
--       FROM public.user_progress
--       WHERE user_id = p_user_id
--         AND completed = true
--         AND completed_at::date = CURRENT_DATE
--         AND lesson_id = ANY(p_challenge_ids);
--
--     ELSIF v_type = 'login_streak' THEN
--       -- Dashboard load = login signal.
--       -- Find the most recent active (non-completed) streak row for this quest.
--       SELECT * INTO v_existing
--       FROM public.user_daily_quests
--       WHERE user_id = p_user_id
--         AND quest_id = v_quest_id
--         AND completed = false
--       ORDER BY period_start DESC
--       LIMIT 1;
--
--       -- Three-case state machine for login streaks.
--       -- Let diff = CURRENT_DATE - period_start (days since streak started).
--       --
--       -- Walkthrough (target = 3):
--       --   Day 1 created:       period_start=D1, current_value=1, diff=0
--       --   Day 1 reload:        diff=0, cv=1 → diff = cv-1 (0=0) → no-op ✓
--       --   Day 2 first load:    diff=1, cv=1 → diff = cv   (1=1) → increment to 2 ✓
--       --   Day 2 reload:        diff=1, cv=2 → diff = cv-1 (1=1) → no-op ✓
--       --   Day 3 first load:    diff=2, cv=2 → diff = cv   (2=2) → increment to 3 → COMPLETE ✓
--       --   Day 5 (skipped D4):  diff=4, cv=3 → diff > cv   (4>3) → gap, start new ✓
--
--       IF v_existing IS NULL THEN
--         -- Case 0: No active streak row — start fresh
--         v_current := 1;
--         v_period  := CURRENT_DATE;
--
--       ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value - 1 THEN
--         -- Case 1: Already counted today (idempotent reload) — no-op
--         -- diff = cv-1 means today is the same day as the last increment
--         v_current := v_existing.current_value;
--         v_period  := v_existing.period_start;
--
--       ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value THEN
--         -- Case 2: Unbroken streak, new day — increment
--         -- diff = cv means yesterday was the last counted day
--         v_current := v_existing.current_value + 1;
--         v_period  := v_existing.period_start;
--
--       ELSE
--         -- Case 3: diff > cv — gap detected, streak broken, start new
--         v_current := 1;
--         v_period  := CURRENT_DATE;
--       END IF;
--
--       -- Completion requires a positive target: a targetValue of 0 must NOT
--       -- auto-complete (that would mint free XP every day for a 0-target quest).
--       v_completed := v_target > 0 AND v_current >= v_target;
--
--       -- Upsert the streak row and skip the generic upsert below
--       INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
--       VALUES (p_user_id, v_quest_id, v_current, v_completed, CASE WHEN v_completed THEN NOW() ELSE NULL END, false, v_period)
--       ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
--         current_value = EXCLUDED.current_value,
--         completed     = EXCLUDED.completed,
--         completed_at  = EXCLUDED.completed_at;
--
--       -- Mark xp_granted on first completion and durably enqueue the XP credit
--       -- in the SAME transaction (atomic with the flip): a quest is never marked
--       -- granted without a pending_onchain_actions row, so the enqueue can never
--       -- be lost to a swallowed app-side error. retryPendingOnchainActions()
--       -- delivers it idempotently via award_xp (reference_id = idempotency key).
--       IF v_completed THEN
--         UPDATE public.user_daily_quests
--         SET xp_granted = true
--         WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;
--
--         IF FOUND THEN
--           v_just_awarded := true;
--           INSERT INTO public.pending_onchain_actions (user_id, action_type, reference_id, payload)
--           VALUES (
--             p_user_id,
--             'quest_xp',
--             v_quest_id || ':' || v_period::text,
--             jsonb_build_object('xpAmount', v_xp, 'memo', 'daily_quest:' || v_quest_id)
--           )
--           ON CONFLICT (user_id, action_type, reference_id) DO NOTHING;
--         END IF;
--       END IF;
--
--       v_results := v_results || jsonb_build_object(
--         'questId', v_quest_id,
--         'currentValue', v_current,
--         'completed', v_completed,
--         'justAwarded', v_just_awarded,
--         'xpReward', v_xp
--       );
--       CONTINUE;  -- Skip generic upsert
--
--     ELSIF v_type = 'module' THEN
--       -- Check if ALL lessons in ANY module are completed AND the last one was completed today
--       v_current := 0;
--       FOR v_mod IN SELECT * FROM jsonb_array_elements(p_module_lesson_map)
--       LOOP
--         v_mod_lessons := ARRAY(SELECT jsonb_array_elements_text(v_mod->'lessonIds'));
--         IF array_length(v_mod_lessons, 1) IS NULL OR array_length(v_mod_lessons, 1) = 0 THEN
--           CONTINUE;
--         END IF;
--
--         -- Check all lessons completed
--         SELECT COUNT(*) = array_length(v_mod_lessons, 1) INTO v_all_done
--         FROM public.user_progress
--         WHERE user_id = p_user_id
--           AND completed = true
--           AND lesson_id = ANY(v_mod_lessons);
--
--         IF v_all_done THEN
--           -- Check if the most recent completion in this module was today
--           SELECT MAX(completed_at::date) INTO v_max_date
--           FROM public.user_progress
--           WHERE user_id = p_user_id
--             AND completed = true
--             AND lesson_id = ANY(v_mod_lessons);
--
--           IF v_max_date = CURRENT_DATE THEN
--             v_current := 1;
--             EXIT;  -- One completed module is enough
--           END IF;
--         END IF;
--       END LOOP;
--
--     ELSE
--       -- Unknown quest type (e.g. a CMS typo). Skip this ONE quest with a loud
--       -- server-log warning rather than RAISE-ing — a single mis-typed quest
--       -- definition must not 500 the whole daily-quests endpoint for every user
--       -- (and, now that the enqueue is transactional, roll back other quests'
--       -- durable XP rows in the same call). It is not rendered as a silent 0/N:
--       -- it is omitted from the result and flagged in the logs for the operator.
--       RAISE WARNING 'get_daily_quest_state: skipping unknown quest type: %', v_type;
--       CONTINUE;
--     END IF;
--
--     -- ── Generic daily quest upsert (lesson, lesson_batch, challenge, module) ──
--     v_period := CURRENT_DATE;
--
--     -- Completion requires a positive target: a targetValue of 0 must NOT
--     -- auto-complete (that would mint free XP every day for a 0-target quest).
--     v_completed := v_target > 0 AND v_current >= v_target;
--
--     INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
--     VALUES (p_user_id, v_quest_id, v_current, v_completed, CASE WHEN v_completed THEN NOW() ELSE NULL END, false, v_period)
--     ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
--       current_value = EXCLUDED.current_value,
--       completed     = EXCLUDED.completed,
--       completed_at  = COALESCE(user_daily_quests.completed_at, EXCLUDED.completed_at);
--
--     -- Mark xp_granted on first completion and durably enqueue the XP credit in
--     -- the SAME transaction (atomic with the flip) — see the login_streak branch.
--     IF v_completed THEN
--       UPDATE public.user_daily_quests
--       SET xp_granted = true
--       WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;
--
--       IF FOUND THEN
--         v_just_awarded := true;
--         INSERT INTO public.pending_onchain_actions (user_id, action_type, reference_id, payload)
--         VALUES (
--           p_user_id,
--           'quest_xp',
--           v_quest_id || ':' || v_period::text,
--           jsonb_build_object('xpAmount', v_xp, 'memo', 'daily_quest:' || v_quest_id)
--         )
--         ON CONFLICT (user_id, action_type, reference_id) DO NOTHING;
--       END IF;
--     END IF;
--
--     v_results := v_results || jsonb_build_object(
--       'questId', v_quest_id,
--       'currentValue', v_current,
--       'completed', v_completed,
--       'justAwarded', v_just_awarded,
--       'xpReward', v_xp
--     );
--   END LOOP;
--
--   RETURN v_results;
-- END;
-- $$;
--
-- REVOKE EXECUTE ON FUNCTION get_daily_quest_state FROM authenticated, anon, public;
-- GRANT EXECUTE ON FUNCTION get_daily_quest_state TO service_role;
--
-- COMMIT;
-- ============================================================================
