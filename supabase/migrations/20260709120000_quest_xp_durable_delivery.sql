-- ============================================================================
-- Migration: quest_xp durable delivery + get_daily_quest_state hardening
-- Task: CS-7 (#353)  [priority:P0][area:db]
-- ----------------------------------------------------------------------------
-- APPLY TO PROD ONLY AFTER THE PR MERGES. Do NOT run against any live database
-- before merge — application is performed post-merge by the orchestrator.
--
-- What this does:
--   1. Allows 'quest_xp' in pending_onchain_actions.action_type so the daily
--      quest route can durably enqueue on-chain XP mints (previously the
--      inline CHECK rejected it and the write was silently dropped).
--   2. Hardens get_daily_quest_state():
--        (a) completion now requires targetValue > 0 (a 0-target quest can no
--            longer auto-complete every day and mint free XP);
--        (b) an unknown quest type raises instead of silently rendering 0/N.
--      The login_streak state machine is unchanged.
--
-- Idempotent: the CHECK change looks up and drops the existing constraint by
-- name (whatever Postgres auto-generated it as) then re-adds a named one; the
-- function is CREATE OR REPLACE. Safe to re-run.
--
-- ── ROLLBACK (tested — restores the pre-migration state) ────────────────────
-- Run the block at the very bottom of this file (kept commented). It restores
-- the original CHECK set (without 'quest_xp') and the prior function body.
-- ============================================================================

-- ── 1. pending_onchain_actions.action_type: allow 'quest_xp' ─────────────────
-- The baseline created this as an inline, unnamed column CHECK. Look up its
-- generated name dynamically (rather than assuming it) and drop it, then re-add
-- a NAMED constraint so future migrations/rollbacks have a stable handle.
DO $$
DECLARE
  v_conname text;
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
  CHECK (action_type IN ('achievement', 'certificate', 'course_finalize', 'xp', 'quest_xp', 'enroll'));

-- ── 2. get_daily_quest_state: targetValue>0 guard + unknown-type RAISE ───────
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

    -- ── Calculate current_value per quest type ──
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
      -- Find the most recent active (non-completed) streak row for this quest.
      SELECT * INTO v_existing
      FROM public.user_daily_quests
      WHERE user_id = p_user_id
        AND quest_id = v_quest_id
        AND completed = false
      ORDER BY period_start DESC
      LIMIT 1;

      -- Three-case state machine for login streaks.
      -- Let diff = CURRENT_DATE - period_start (days since streak started).
      --
      -- Walkthrough (target = 3):
      --   Day 1 created:       period_start=D1, current_value=1, diff=0
      --   Day 1 reload:        diff=0, cv=1 → diff = cv-1 (0=0) → no-op ✓
      --   Day 2 first load:    diff=1, cv=1 → diff = cv   (1=1) → increment to 2 ✓
      --   Day 2 reload:        diff=1, cv=2 → diff = cv-1 (1=1) → no-op ✓
      --   Day 3 first load:    diff=2, cv=2 → diff = cv   (2=2) → increment to 3 → COMPLETE ✓
      --   Day 5 (skipped D4):  diff=4, cv=3 → diff > cv   (4>3) → gap, start new ✓

      IF v_existing IS NULL THEN
        -- Case 0: No active streak row — start fresh
        v_current := 1;
        v_period  := CURRENT_DATE;

      ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value - 1 THEN
        -- Case 1: Already counted today (idempotent reload) — no-op
        -- diff = cv-1 means today is the same day as the last increment
        v_current := v_existing.current_value;
        v_period  := v_existing.period_start;

      ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value THEN
        -- Case 2: Unbroken streak, new day — increment
        -- diff = cv means yesterday was the last counted day
        v_current := v_existing.current_value + 1;
        v_period  := v_existing.period_start;

      ELSE
        -- Case 3: diff > cv — gap detected, streak broken, start new
        v_current := 1;
        v_period  := CURRENT_DATE;
      END IF;

      -- Completion requires a positive target: a targetValue of 0 must NOT
      -- auto-complete (that would mint free XP every day for a 0-target quest).
      v_completed := v_target > 0 AND v_current >= v_target;

      -- Upsert the streak row and skip the generic upsert below
      INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
      VALUES (p_user_id, v_quest_id, v_current, v_completed, CASE WHEN v_completed THEN NOW() ELSE NULL END, false, v_period)
      ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        completed     = EXCLUDED.completed,
        completed_at  = EXCLUDED.completed_at;

      -- Mark xp_granted on first completion (API route mints on-chain)
      IF v_completed THEN
        UPDATE public.user_daily_quests
        SET xp_granted = true
        WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;

        IF FOUND THEN
          v_just_awarded := true;
        END IF;
      END IF;

      v_results := v_results || jsonb_build_object(
        'questId', v_quest_id,
        'currentValue', v_current,
        'completed', v_completed,
        'justAwarded', v_just_awarded,
        'xpReward', v_xp
      );
      CONTINUE;  -- Skip generic upsert

    ELSIF v_type = 'module' THEN
      -- Check if ALL lessons in ANY module are completed AND the last one was completed today
      v_current := 0;
      FOR v_mod IN SELECT * FROM jsonb_array_elements(p_module_lesson_map)
      LOOP
        v_mod_lessons := ARRAY(SELECT jsonb_array_elements_text(v_mod->'lessonIds'));
        IF array_length(v_mod_lessons, 1) IS NULL OR array_length(v_mod_lessons, 1) = 0 THEN
          CONTINUE;
        END IF;

        -- Check all lessons completed
        SELECT COUNT(*) = array_length(v_mod_lessons, 1) INTO v_all_done
        FROM public.user_progress
        WHERE user_id = p_user_id
          AND completed = true
          AND lesson_id = ANY(v_mod_lessons);

        IF v_all_done THEN
          -- Check if the most recent completion in this module was today
          SELECT MAX(completed_at::date) INTO v_max_date
          FROM public.user_progress
          WHERE user_id = p_user_id
            AND completed = true
            AND lesson_id = ANY(v_mod_lessons);

          IF v_max_date = CURRENT_DATE THEN
            v_current := 1;
            EXIT;  -- One completed module is enough
          END IF;
        END IF;
      END LOOP;

    ELSE
      -- Unknown quest type: fail loudly rather than silently rendering 0/N
      -- (a mis-typed quest definition should never quietly evaluate to 0).
      RAISE EXCEPTION 'get_daily_quest_state: unknown quest type: %', v_type;
    END IF;

    -- ── Generic daily quest upsert (lesson, lesson_batch, challenge, module) ──
    v_period := CURRENT_DATE;

    -- Completion requires a positive target: a targetValue of 0 must NOT
    -- auto-complete (that would mint free XP every day for a 0-target quest).
    v_completed := v_target > 0 AND v_current >= v_target;

    INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
    VALUES (p_user_id, v_quest_id, v_current, v_completed, CASE WHEN v_completed THEN NOW() ELSE NULL END, false, v_period)
    ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
      current_value = EXCLUDED.current_value,
      completed     = EXCLUDED.completed,
      completed_at  = COALESCE(user_daily_quests.completed_at, EXCLUDED.completed_at);

    -- Mark xp_granted on first completion (API route mints on-chain)
    IF v_completed THEN
      UPDATE public.user_daily_quests
      SET xp_granted = true
      WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;

      IF FOUND THEN
        v_just_awarded := true;
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

-- Re-assert the function's privileges (SECURITY DEFINER — must never be
-- executable by untrusted roles; only service_role calls it).
REVOKE EXECUTE ON FUNCTION get_daily_quest_state FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION get_daily_quest_state TO service_role;

-- ============================================================================
-- ROLLBACK (tested) — restores the exact pre-migration state.
-- Run the following block to revert this migration:
-- ----------------------------------------------------------------------------
-- BEGIN;
--
-- -- Restore the original CHECK set (drops 'quest_xp'). NOTE: any rows already
-- -- written with action_type='quest_xp' must be resolved/removed first or the
-- -- ADD CONSTRAINT will fail its validation scan:
-- --   DELETE FROM public.pending_onchain_actions WHERE action_type = 'quest_xp';
-- DO $$
-- DECLARE
--   v_conname text;
-- BEGIN
--   SELECT conname
--     INTO v_conname
--   FROM pg_constraint
--   WHERE conrelid = 'public.pending_onchain_actions'::regclass
--     AND contype = 'c'
--     AND pg_get_constraintdef(oid) ILIKE '%action_type%';
--   IF v_conname IS NOT NULL THEN
--     EXECUTE format(
--       'ALTER TABLE public.pending_onchain_actions DROP CONSTRAINT %I',
--       v_conname
--     );
--   END IF;
-- END $$;
--
-- ALTER TABLE public.pending_onchain_actions
--   ADD CONSTRAINT pending_onchain_actions_action_type_check
--   CHECK (action_type IN ('achievement', 'certificate', 'course_finalize', 'xp', 'enroll'));
--
-- -- Restore the prior function body (no targetValue guard, no unknown-type RAISE).
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
--       SELECT * INTO v_existing
--       FROM public.user_daily_quests
--       WHERE user_id = p_user_id
--         AND quest_id = v_quest_id
--         AND completed = false
--       ORDER BY period_start DESC
--       LIMIT 1;
--
--       IF v_existing IS NULL THEN
--         v_current := 1;
--         v_period  := CURRENT_DATE;
--       ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value - 1 THEN
--         v_current := v_existing.current_value;
--         v_period  := v_existing.period_start;
--       ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value THEN
--         v_current := v_existing.current_value + 1;
--         v_period  := v_existing.period_start;
--       ELSE
--         v_current := 1;
--         v_period  := CURRENT_DATE;
--       END IF;
--
--       INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
--       VALUES (p_user_id, v_quest_id, v_current, v_current >= v_target, CASE WHEN v_current >= v_target THEN NOW() ELSE NULL END, false, v_period)
--       ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
--         current_value = EXCLUDED.current_value,
--         completed     = EXCLUDED.completed,
--         completed_at  = EXCLUDED.completed_at;
--
--       IF v_current >= v_target THEN
--         UPDATE public.user_daily_quests
--         SET xp_granted = true
--         WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;
--         IF FOUND THEN
--           v_just_awarded := true;
--         END IF;
--       END IF;
--
--       v_results := v_results || jsonb_build_object(
--         'questId', v_quest_id,
--         'currentValue', v_current,
--         'completed', v_current >= v_target,
--         'justAwarded', v_just_awarded,
--         'xpReward', v_xp
--       );
--       CONTINUE;
--
--     ELSIF v_type = 'module' THEN
--       v_current := 0;
--       FOR v_mod IN SELECT * FROM jsonb_array_elements(p_module_lesson_map)
--       LOOP
--         v_mod_lessons := ARRAY(SELECT jsonb_array_elements_text(v_mod->'lessonIds'));
--         IF array_length(v_mod_lessons, 1) IS NULL OR array_length(v_mod_lessons, 1) = 0 THEN
--           CONTINUE;
--         END IF;
--
--         SELECT COUNT(*) = array_length(v_mod_lessons, 1) INTO v_all_done
--         FROM public.user_progress
--         WHERE user_id = p_user_id
--           AND completed = true
--           AND lesson_id = ANY(v_mod_lessons);
--
--         IF v_all_done THEN
--           SELECT MAX(completed_at::date) INTO v_max_date
--           FROM public.user_progress
--           WHERE user_id = p_user_id
--             AND completed = true
--             AND lesson_id = ANY(v_mod_lessons);
--
--           IF v_max_date = CURRENT_DATE THEN
--             v_current := 1;
--             EXIT;
--           END IF;
--         END IF;
--       END LOOP;
--     END IF;
--
--     v_period := CURRENT_DATE;
--
--     INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
--     VALUES (p_user_id, v_quest_id, v_current, v_current >= v_target, CASE WHEN v_current >= v_target THEN NOW() ELSE NULL END, false, v_period)
--     ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
--       current_value = EXCLUDED.current_value,
--       completed     = EXCLUDED.completed,
--       completed_at  = COALESCE(user_daily_quests.completed_at, EXCLUDED.completed_at);
--
--     IF v_current >= v_target THEN
--       UPDATE public.user_daily_quests
--       SET xp_granted = true
--       WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;
--       IF FOUND THEN
--         v_just_awarded := true;
--       END IF;
--     END IF;
--
--     v_results := v_results || jsonb_build_object(
--       'questId', v_quest_id,
--       'currentValue', v_current,
--       'completed', v_current >= v_target,
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
