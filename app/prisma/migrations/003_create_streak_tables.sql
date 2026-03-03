-- ============================================================================
-- Superteam Academy — Streak Tables Migration
-- ============================================================================

-- =========================
-- Main streak state (1 row per user)
-- =========================
CREATE TABLE IF NOT EXISTS streaks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak    INT NOT NULL DEFAULT 0,
  longest_streak    INT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  freeze_count      INT NOT NULL DEFAULT 3,
  max_freezes       INT NOT NULL DEFAULT 3,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- =========================
-- Daily activity log (1 row per user per day)
-- =========================
CREATE TABLE IF NOT EXISTS streak_activity (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_date     DATE NOT NULL,
  xp_earned         INT NOT NULL DEFAULT 0,
  lessons_completed INT NOT NULL DEFAULT 0,
  courses_completed INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

-- =========================
-- Milestone claims (1 row per user per milestone tier)
-- =========================
CREATE TABLE IF NOT EXISTS streak_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_days  INT NOT NULL,
  xp_reward       INT NOT NULL,
  claimed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_days)
);

-- =========================
-- Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_activity_user_id ON streak_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_activity_date ON streak_activity(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_streak_milestones_user_id ON streak_milestones(user_id);

-- =========================
-- RLS
-- =========================
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_milestones ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to streaks" ON streaks
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

CREATE POLICY "Service role has full access to streak_activity" ON streak_activity
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

CREATE POLICY "Service role has full access to streak_milestones" ON streak_milestones
  FOR ALL USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- =========================
-- Trigger: auto-update updated_at
-- =========================
CREATE TRIGGER streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER streak_activity_updated_at
  BEFORE UPDATE ON streak_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =========================
-- RPC: record_streak_activity (atomic upsert + streak calculation)
-- =========================
CREATE OR REPLACE FUNCTION record_streak_activity(
  p_user_id UUID,
  p_xp_earned INT DEFAULT 0,
  p_lessons_completed INT DEFAULT 0,
  p_courses_completed INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - 1;
  v_streak RECORD;
  v_new_current INT;
  v_new_longest INT;
  v_new_freeze INT;
  v_days_missed INT;
BEGIN
  -- Upsert today's activity
  INSERT INTO streak_activity (user_id, activity_date, xp_earned, lessons_completed, courses_completed)
  VALUES (p_user_id, v_today, p_xp_earned, p_lessons_completed, p_courses_completed)
  ON CONFLICT (user_id, activity_date)
  DO UPDATE SET
    xp_earned = streak_activity.xp_earned + EXCLUDED.xp_earned,
    lessons_completed = streak_activity.lessons_completed + EXCLUDED.lessons_completed,
    courses_completed = streak_activity.courses_completed + EXCLUDED.courses_completed,
    updated_at = now();

  -- Get or create streak row
  INSERT INTO streaks (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_streak FROM streaks WHERE user_id = p_user_id FOR UPDATE;

  -- Calculate new streak
  IF v_streak.last_activity_date = v_today THEN
    -- Already recorded today — just return current state
    RETURN json_build_object(
      'current_streak', v_streak.current_streak,
      'longest_streak', v_streak.longest_streak,
      'freeze_count', v_streak.freeze_count,
      'last_activity_date', v_today
    );
  ELSIF v_streak.last_activity_date = v_yesterday THEN
    -- Continue streak
    v_new_current := v_streak.current_streak + 1;
    v_new_freeze := v_streak.freeze_count;
  ELSIF v_streak.last_activity_date IS NOT NULL THEN
    -- Check gap
    v_days_missed := v_today - v_streak.last_activity_date;
    IF v_days_missed = 2 AND v_streak.freeze_count > 0 THEN
      -- Auto-freeze (missed exactly 1 day)
      v_new_current := v_streak.current_streak + 1;
      v_new_freeze := v_streak.freeze_count - 1;
    ELSE
      -- Streak broken
      v_new_current := 1;
      v_new_freeze := v_streak.freeze_count;
    END IF;
  ELSE
    -- First ever activity
    v_new_current := 1;
    v_new_freeze := v_streak.max_freezes;
  END IF;

  v_new_longest := GREATEST(v_streak.longest_streak, v_new_current);

  -- Update streak
  UPDATE streaks
  SET current_streak = v_new_current,
      longest_streak = v_new_longest,
      freeze_count = v_new_freeze,
      last_activity_date = v_today,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'current_streak', v_new_current,
    'longest_streak', v_new_longest,
    'freeze_count', v_new_freeze,
    'last_activity_date', v_today
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
