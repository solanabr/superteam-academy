-- ============================================================================
-- Migration: review quest kind — get_daily_quest_state 'review' branch
-- Task: LX-B7 (#572)  [priority:P2][area:quests]
-- ----------------------------------------------------------------------------
-- ⚠️  MERGE-ORDER REQUIREMENT — APPLY THIS MIGRATION BEFORE (OR ATOMICALLY WITH)
--     THE CODE DEPLOY. NEVER AFTER. (CS-7 precedent: 20260709120000.)
--
--     prod (superteam-academy-web.vercel.app) auto-deploys from `main` on merge.
--     This migration only ADDS an ELSIF branch for a new quest type ('review');
--     old code never sends type='review' (that arrives only when the review
--     quest's content YAML is authored in courses-academy AND activated by a
--     content.lock bump — a separate, later step, gated on the /review page,
--     LX-B5). So new-SQL + old-code coexist safely, and the reverse (old-SQL +
--     new-code) is also safe: a 'review' quest against the pre-branch function
--     hits the ELSE arm and is skipped with a server-log WARNING, never a 500
--     (the "unknown-type skip" the issue relies on for early YAML staging).
--
-- WHAT THIS DOES — a single ADDITIVE ELSIF between the 'module' and the ELSE
-- arms of get_daily_quest_state. The branch ONLY computes v_current (count of
-- the caller's review_items cleared today) and falls through to the SHARED
-- generic upsert, so the xp_granted / pending_onchain_actions atomicity
-- invariant is inherited verbatim and every existing quest type is byte-for-
-- byte unchanged. "Cleared today" = last_result IS TRUE AND last_reviewed_at is
-- today: a pass advances the box, a miss (last_result=false) does not count.
--
-- review_items is the #569 / LX-B3 substrate (already on main). This migration
-- reads it; it creates nothing and grants nothing new. Quest XP still rides the
-- unchanged quest_xp rail (retryPendingOnchainActions -> award_xp).
--
-- SECURITY DEFINER, search_path='' — unchanged from the prior definition. The
-- function stays REVOKEd from authenticated/anon/public and GRANTed only to
-- service_role (re-issued below).
--
-- Idempotent: CREATE OR REPLACE. Safe to re-apply. Explicit BEGIN/COMMIT so the
-- whole file is one transaction under a manual psql apply.
--
-- Mirrored into supabase/schema.sql (the full-schema snapshot).
-- A tested ROLLBACK block (restores the pre-'review' body verbatim) is at the
-- bottom of this file.
-- ============================================================================

BEGIN;

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

      -- Mark xp_granted on first completion and durably enqueue the XP credit
      -- in the SAME transaction (atomic with the flip): a quest is never marked
      -- granted without a pending_onchain_actions row, so the enqueue can never
      -- be lost to a swallowed app-side error. retryPendingOnchainActions()
      -- delivers it idempotently via award_xp (reference_id = idempotency key).
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

    ELSIF v_type = 'review' THEN
      -- Reviews CLEARED today = the learner's own review_items passed today.
      -- A pass advances the item's spacing box (record_review_result); a miss
      -- resets it to box 1 with last_result=false, which is NOT a clear and so
      -- must not count. Additive branch: it only computes v_current and falls
      -- through to the generic upsert below, so the xp_granted /
      -- pending_onchain_actions atomicity invariant is inherited unchanged and
      -- no other quest type is affected.
      SELECT COUNT(*)::INTEGER INTO v_current
      FROM public.review_items
      WHERE user_id = p_user_id
        AND last_result = true
        AND last_reviewed_at::date = CURRENT_DATE;

    ELSE
      -- Unknown quest type (e.g. a CMS typo). Skip this ONE quest with a loud
      -- server-log warning rather than RAISE-ing — a single mis-typed quest
      -- definition must not 500 the whole daily-quests endpoint for every user
      -- (and, now that the enqueue is transactional, roll back other quests'
      -- durable XP rows in the same call). It is not rendered as a silent 0/N:
      -- it is omitted from the result and flagged in the logs for the operator.
      RAISE WARNING 'get_daily_quest_state: skipping unknown quest type: %', v_type;
      CONTINUE;
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

    -- Mark xp_granted on first completion and durably enqueue the XP credit in
    -- the SAME transaction (atomic with the flip) — see the login_streak branch.
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
-- ROLLBACK (tested) — restores the exact pre-migration function body (the
-- 'review' ELSIF removed; every other arm identical). Nothing else to undo:
-- this migration created no tables, constraints, or grants. review_items rows
-- are untouched. Run the block below (uncomment) to revert:
-- ----------------------------------------------------------------------------
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
