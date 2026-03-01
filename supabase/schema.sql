-- ============================================
-- Superteam LMS — Complete Database Schema
-- Run this once in Supabase SQL Editor
-- ============================================

-- ─────────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  google_id TEXT UNIQUE,
  github_id TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  name_rerolls_used INTEGER DEFAULT 0,
  wallet_xp_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  tx_signature TEXT,
  wallet_address TEXT,
  UNIQUE(user_id, course_id)
);

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  tx_signature TEXT,
  lesson_index SMALLINT,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE
);

CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tx_signature TEXT,
  idempotency_key TEXT
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  tx_signature TEXT,
  asset_address TEXT,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  mint_address TEXT,
  metadata_uri TEXT,
  minted_at TIMESTAMPTZ DEFAULT NOW(),
  tx_signature TEXT,
  credential_type TEXT DEFAULT 'legacy',
  UNIQUE(user_id, course_id)
);

-- Stores full Metaplex metadata JSON so the on-chain URI stays under 200 bytes.
-- Served by GET /api/certificates/metadata?id=<uuid>.
CREATE TABLE nft_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SIWS Nonce Replay Protection
-- ============================================
CREATE TABLE IF NOT EXISTS siws_nonces (
  nonce TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'consumed')),
  wallet_address TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at TIMESTAMPTZ
);

CREATE INDEX idx_siws_nonces_created_at ON siws_nonces (created_at);
CREATE INDEX idx_siws_nonces_status ON siws_nonces (status);

ALTER TABLE siws_nonces ENABLE ROW LEVEL SECURITY;

-- No public access — only service_role can read/write
CREATE POLICY "Service role only" ON siws_nonces
  FOR ALL USING (false);

-- ============================================
-- Data Integrity CHECK Constraints
-- ============================================
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_username_length CHECK (char_length(username) BETWEEN 1 AND 30);
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_name_rerolls_non_negative CHECK (name_rerolls_used >= 0);
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_name_rerolls_max CHECK (name_rerolls_used <= 3);

ALTER TABLE user_xp
  ADD CONSTRAINT chk_user_xp_total_xp_non_negative CHECK (total_xp >= 0);
ALTER TABLE user_xp
  ADD CONSTRAINT chk_user_xp_level_non_negative CHECK (level >= 0);
ALTER TABLE user_xp
  ADD CONSTRAINT chk_user_xp_current_streak_non_negative CHECK (current_streak >= 0);
ALTER TABLE user_xp
  ADD CONSTRAINT chk_user_xp_longest_streak_non_negative CHECK (longest_streak >= 0);
ALTER TABLE user_xp
  ADD CONSTRAINT chk_user_xp_longest_gte_current CHECK (longest_streak >= current_streak);

ALTER TABLE xp_transactions
  ADD CONSTRAINT chk_xp_transactions_amount_positive CHECK (amount > 0);

-- ─────────────────────────────────────────────
-- 2. INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created_at ON xp_transactions(created_at);
CREATE UNIQUE INDEX idx_xp_transactions_idempotency
  ON xp_transactions (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_user_xp_total_xp ON user_xp(total_xp DESC);

-- ─────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_metadata ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- enrollments
CREATE POLICY "Users can view their own enrollments"
  ON enrollments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves"
  ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollments"
  ON enrollments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public profile enrollments are viewable"
  ON enrollments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = enrollments.user_id
      AND profiles.is_public = true
    )
  );

-- user_progress
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public profile progress is viewable"
  ON user_progress FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_progress.user_id
      AND profiles.is_public = true
    )
  );

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- user_xp (SELECT only — mutations via SECURITY DEFINER functions)
CREATE POLICY "Users can view their own XP"
  ON user_xp FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Leaderboard: anyone can view XP rankings"
  ON user_xp FOR SELECT USING (true);

-- xp_transactions (SELECT only — inserts via award_xp function)
CREATE POLICY "Users can view their own XP transactions"
  ON xp_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view XP transactions for leaderboard"
  ON xp_transactions FOR SELECT USING (true);

-- user_achievements (SELECT only — inserts via unlock_achievement function)
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public achievements are viewable on public profiles"
  ON user_achievements FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_achievements.user_id
      AND profiles.is_public = true
    )
  );

-- certificates
CREATE POLICY "Users can view their own certificates"
  ON certificates FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public certificates are viewable by everyone"
  ON certificates FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = certificates.user_id
      AND profiles.is_public = true
    )
  );

-- NOTE: No INSERT or UPDATE policies on certificates.
-- All certificate writes go through service_role via the API routes.
-- Allowing authenticated users to self-issue certificates would let them
-- fabricate completion records for courses they have not finished.

-- nft_metadata (public read only — writes via service_role API routes)
CREATE POLICY "Anyone can read nft metadata"
  ON nft_metadata FOR SELECT USING (true);

-- NOTE: No INSERT policy on nft_metadata for authenticated users.
-- All metadata rows are inserted by the lesson-complete API route using
-- the service_role key. An open authenticated INSERT policy would allow
-- any logged-in user to flood the table or plant fake metadata.

-- ─────────────────────────────────────────────
-- 4. SECURE SERVER-SIDE FUNCTIONS
-- ─────────────────────────────────────────────

-- Award XP (called from API routes with service_role key only)
-- Also handles streak tracking: increments current_streak if last activity was
-- yesterday, resets to 1 if gap > 1 day, and updates longest_streak.
-- p_idempotency_key: when provided, uses ON CONFLICT DO NOTHING to prevent
-- double-award from concurrent retries (race-safe deduplication).
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT DEFAULT NULL,
  p_tx_signature TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
  v_new_longest INTEGER;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO xp_transactions (user_id, amount, reason, idempotency_key, tx_signature)
    VALUES (p_user_id, p_amount, p_reason, p_idempotency_key, p_tx_signature)
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    -- If nothing was inserted (duplicate), skip the XP update too
    IF NOT FOUND THEN
      RETURN;
    END IF;
  ELSE
    INSERT INTO xp_transactions (user_id, amount, reason, tx_signature)
    VALUES (p_user_id, p_amount, p_reason, p_tx_signature);
  END IF;

  -- Get current streak state before updating
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM user_xp
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

  INSERT INTO user_xp (user_id, total_xp, level, last_activity_date, current_streak, longest_streak)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unlock achievement (called from API routes with service_role key only)
CREATE OR REPLACE FUNCTION unlock_achievement(
  p_user_id UUID,
  p_achievement_id TEXT,
  p_tx_signature TEXT DEFAULT NULL,
  p_asset_address TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO user_achievements (user_id, achievement_id, tx_signature, asset_address)
  VALUES (p_user_id, p_achievement_id, p_tx_signature, p_asset_address)
  ON CONFLICT (user_id, achievement_id) DO UPDATE
    SET tx_signature = COALESCE(EXCLUDED.tx_signature, user_achievements.tx_signature),
        asset_address = COALESCE(EXCLUDED.asset_address, user_achievements.asset_address);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    'user_' || LEFT(NEW.id::text, 8),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  INSERT INTO public.user_xp (user_id, total_xp, level)
  VALUES (NEW.id, 0, 0);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────
-- 5b. LEADERBOARD RPC
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_timeframe TEXT DEFAULT 'alltime', p_limit INT DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  total_xp BIGINT,
  level INT,
  rank BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF p_timeframe = 'alltime' THEN
    RETURN QUERY
      SELECT
        ux.user_id,
        p.username,
        p.avatar_url,
        ux.total_xp::BIGINT,
        ux.level,
        ROW_NUMBER() OVER (ORDER BY ux.total_xp DESC)::BIGINT AS rank
      FROM public.user_xp ux
      JOIN public.profiles p ON p.id = ux.user_id
      WHERE ux.total_xp > 0
        AND p.username IS NOT NULL
        AND p.username <> ''
      ORDER BY ux.total_xp DESC
      LIMIT p_limit;
  ELSE
    RETURN QUERY
      SELECT
        sub.user_id,
        sub.username,
        sub.avatar_url,
        sub.total_xp,
        COALESCE(ux.level, FLOOR(SQRT(sub.total_xp / 100.0))::INT) AS level,
        ROW_NUMBER() OVER (ORDER BY sub.total_xp DESC)::BIGINT AS rank
      FROM (
        SELECT
          xt.user_id,
          p.username,
          p.avatar_url,
          SUM(xt.amount)::BIGINT AS total_xp
        FROM public.xp_transactions xt
        JOIN public.profiles p ON p.id = xt.user_id
        WHERE p.username IS NOT NULL
          AND p.username <> ''
          AND xt.created_at >= CASE
            WHEN p_timeframe = 'weekly'  THEN NOW() - INTERVAL '7 days'
            WHEN p_timeframe = 'monthly' THEN NOW() - INTERVAL '1 month'
          END
        GROUP BY xt.user_id, p.username, p.avatar_url
      ) sub
      LEFT JOIN public.user_xp ux ON ux.user_id = sub.user_id
      ORDER BY sub.total_xp DESC
      LIMIT p_limit;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, INT) TO authenticated, anon;

-- ─────────────────────────────────────────────
-- 6. RESTRICT SECURITY DEFINER FUNCTIONS
-- ─────────────────────────────────────────────
-- F-06 & F-07: Revoke direct RPC access from client roles.
-- These functions must only be callable via service_role (API routes).
REVOKE EXECUTE ON FUNCTION award_xp FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION unlock_achievement FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION award_xp TO service_role;
GRANT EXECUTE ON FUNCTION unlock_achievement TO service_role;

-- ─────────────────────────────────────────────
-- 7. STORAGE — AVATAR BUCKET
-- ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- Deployed Programs (student program deployments on devnet)
-- ============================================================================

CREATE TABLE deployed_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'devnet',
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id, lesson_id)
);

CREATE INDEX idx_deployed_programs_user_id ON deployed_programs(user_id);
CREATE INDEX idx_deployed_programs_course_id ON deployed_programs(course_id);

ALTER TABLE deployed_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deployments"
  ON deployed_programs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deployments"
  ON deployed_programs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deployments"
  ON deployed_programs FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 8. PENDING ON-CHAIN ACTIONS (retry queue)
-- ─────────────────────────────────────────────

CREATE TABLE pending_onchain_actions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type    TEXT NOT NULL CHECK (action_type IN ('achievement', 'certificate', 'course_finalize', 'xp', 'enroll')),
  reference_id   TEXT NOT NULL,
  payload        JSONB NOT NULL,
  failed_at      TIMESTAMPTZ DEFAULT NOW(),
  retry_count    INT DEFAULT 0,
  last_error     TEXT,
  resolved_at    TIMESTAMPTZ,
  UNIQUE(user_id, action_type, reference_id)
);

CREATE INDEX idx_pending_onchain_actions_user_id
  ON pending_onchain_actions(user_id)
  WHERE resolved_at IS NULL;

ALTER TABLE pending_onchain_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_pending_actions"
  ON pending_onchain_actions
  FOR SELECT USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- DAILY QUESTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE user_daily_quests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id      TEXT NOT NULL,
  current_value INTEGER DEFAULT 0,
  completed     BOOLEAN DEFAULT false,
  completed_at  TIMESTAMPTZ,
  xp_granted    BOOLEAN DEFAULT false,
  period_start  DATE NOT NULL,
  UNIQUE(user_id, quest_id, period_start)
);

CREATE INDEX idx_user_daily_quests_user_period
  ON user_daily_quests(user_id, period_start);

ALTER TABLE user_daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily quests"
  ON user_daily_quests FOR SELECT USING (auth.uid() = user_id);

-- ── get_daily_quest_state ─────────────────────────────────────
-- Single-pass function: evaluates all quest progress for a user,
-- upserts rows, awards XP on first completion (idempotent).
-- Called via service_role from /api/quests/daily.
CREATE OR REPLACE FUNCTION get_daily_quest_state(
  p_user_id           UUID,
  p_quest_definitions JSONB,
  p_challenge_ids     TEXT[],
  p_module_lesson_map JSONB
) RETURNS JSONB AS $$
DECLARE
  v_quest       JSONB;
  v_quest_id    TEXT;
  v_type        TEXT;
  v_target      INTEGER;
  v_xp          INTEGER;
  v_reset_type  TEXT;
  v_current     INTEGER;
  v_period      DATE;
  v_existing    RECORD;
  v_results     JSONB := '[]'::JSONB;
  v_mod         JSONB;
  v_mod_lessons TEXT[];
  v_all_done    BOOLEAN;
  v_max_date    DATE;
BEGIN
  FOR v_quest IN SELECT * FROM jsonb_array_elements(p_quest_definitions)
  LOOP
    v_quest_id   := v_quest->>'id';
    v_type       := v_quest->>'type';
    v_target     := (v_quest->>'targetValue')::INTEGER;
    v_xp         := (v_quest->>'xpReward')::INTEGER;
    v_reset_type := v_quest->>'resetType';
    v_current    := 0;

    -- ── Calculate current_value per quest type ──
    IF v_type = 'lesson' OR v_type = 'lesson_batch' THEN
      SELECT COUNT(*)::INTEGER INTO v_current
      FROM user_progress
      WHERE user_id = p_user_id
        AND completed = true
        AND completed_at::date = CURRENT_DATE;

    ELSIF v_type = 'challenge' THEN
      SELECT COUNT(*)::INTEGER INTO v_current
      FROM user_progress
      WHERE user_id = p_user_id
        AND completed = true
        AND completed_at::date = CURRENT_DATE
        AND lesson_id = ANY(p_challenge_ids);

    ELSIF v_type = 'login_streak' THEN
      -- Dashboard load = login signal.
      -- Find the most recent active (non-completed) streak row for this quest.
      SELECT * INTO v_existing
      FROM user_daily_quests
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

      -- Upsert the streak row and skip the generic upsert below
      INSERT INTO user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
      VALUES (p_user_id, v_quest_id, v_current, v_current >= v_target, CASE WHEN v_current >= v_target THEN NOW() ELSE NULL END, false, v_period)
      ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        completed     = EXCLUDED.completed,
        completed_at  = EXCLUDED.completed_at;

      -- Award XP if just completed
      IF v_current >= v_target THEN
        UPDATE user_daily_quests
        SET xp_granted = true
        WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;

        IF FOUND THEN
          PERFORM award_xp(p_user_id, v_xp, 'daily_quest:' || v_quest_id, 'quest:' || v_quest_id || ':' || v_period::TEXT);
        END IF;
      END IF;

      v_results := v_results || jsonb_build_object(
        'questId', v_quest_id,
        'currentValue', v_current,
        'completed', v_current >= v_target
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
        FROM user_progress
        WHERE user_id = p_user_id
          AND completed = true
          AND lesson_id = ANY(v_mod_lessons);

        IF v_all_done THEN
          -- Check if the most recent completion in this module was today
          SELECT MAX(completed_at::date) INTO v_max_date
          FROM user_progress
          WHERE user_id = p_user_id
            AND completed = true
            AND lesson_id = ANY(v_mod_lessons);

          IF v_max_date = CURRENT_DATE THEN
            v_current := 1;
            EXIT;  -- One completed module is enough
          END IF;
        END IF;
      END LOOP;
    END IF;

    -- ── Generic daily quest upsert (lesson, lesson_batch, challenge, module) ──
    v_period := CURRENT_DATE;

    INSERT INTO user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
    VALUES (p_user_id, v_quest_id, v_current, v_current >= v_target, CASE WHEN v_current >= v_target THEN NOW() ELSE NULL END, false, v_period)
    ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
      current_value = EXCLUDED.current_value,
      completed     = EXCLUDED.completed,
      completed_at  = COALESCE(user_daily_quests.completed_at, EXCLUDED.completed_at);

    -- Award XP if just completed (xp_granted transitions false → true)
    IF v_current >= v_target THEN
      UPDATE user_daily_quests
      SET xp_granted = true
      WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;

      IF FOUND THEN
        PERFORM award_xp(p_user_id, v_xp, 'daily_quest:' || v_quest_id, 'quest:' || v_quest_id || ':' || v_period::TEXT);
      END IF;
    END IF;

    v_results := v_results || jsonb_build_object(
      'questId', v_quest_id,
      'currentValue', v_current,
      'completed', v_current >= v_target
    );
  END LOOP;

  RETURN v_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION get_daily_quest_state FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION get_daily_quest_state TO service_role;

-- ============================================================
-- Community Forum: Core Tables
-- ============================================================

-- Forum categories (global sections)
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Threads (global + course/lesson scoped)
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 5 AND 200),
  slug TEXT NOT NULL,
  short_id TEXT GENERATED ALWAYS AS (LEFT(id::text, 8)) STORED,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 10 AND 10000),
  type TEXT NOT NULL CHECK (type IN ('question', 'discussion')),

  category_id UUID REFERENCES forum_categories(id),
  course_id TEXT,
  lesson_id TEXT,

  is_solved BOOLEAN NOT NULL DEFAULT false,
  accepted_answer_id UUID,

  answer_count INT NOT NULL DEFAULT 0,
  vote_score INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,

  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,

  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_global_thread_has_category
    CHECK (course_id IS NOT NULL OR category_id IS NOT NULL)
);

-- Answers (flat, Stack Overflow style)
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  vote_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK from threads.accepted_answer_id → answers (deferred, answers table must exist first)
ALTER TABLE threads
  ADD CONSTRAINT fk_threads_accepted_answer
  FOREIGN KEY (accepted_answer_id) REFERENCES answers(id) ON DELETE SET NULL;

-- Votes (polymorphic: either thread or answer, never both)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_vote_target_exclusive CHECK (
    (thread_id IS NOT NULL AND answer_id IS NULL) OR
    (thread_id IS NULL AND answer_id IS NOT NULL)
  )
);

-- Partial unique indexes (NULL != NULL in Postgres UNIQUE constraints)
CREATE UNIQUE INDEX votes_user_thread_unique
  ON votes(user_id, thread_id) WHERE thread_id IS NOT NULL;
CREATE UNIQUE INDEX votes_user_answer_unique
  ON votes(user_id, answer_id) WHERE answer_id IS NOT NULL;

-- Flags (moderation)
CREATE TABLE flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'off-topic', 'other')),
  details TEXT CHECK (details IS NULL OR length(details) <= 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_flag_target_exclusive CHECK (
    (thread_id IS NOT NULL AND answer_id IS NULL) OR
    (thread_id IS NULL AND answer_id IS NOT NULL)
  )
);

-- ============================================================
-- Community Forum: Indexes
-- ============================================================

CREATE INDEX idx_threads_last_activity ON threads(last_activity_at DESC, id DESC);
CREATE INDEX idx_threads_category ON threads(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_threads_course ON threads(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_threads_lesson ON threads(lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX idx_threads_author ON threads(author_id);
CREATE INDEX idx_threads_type_unsolved ON threads(type, is_solved) WHERE type = 'question' AND is_solved = false;
CREATE INDEX idx_threads_short_id ON threads(short_id);

CREATE INDEX idx_answers_thread ON answers(thread_id);
CREATE INDEX idx_answers_author ON answers(author_id);

CREATE INDEX idx_votes_thread ON votes(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_votes_answer ON votes(answer_id) WHERE answer_id IS NOT NULL;
CREATE INDEX idx_votes_user ON votes(user_id);

CREATE INDEX idx_flags_status ON flags(status) WHERE status = 'pending';

-- Full-text search on threads (weighted: title A, body B)
ALTER TABLE threads ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) STORED;
CREATE INDEX idx_threads_search ON threads USING gin(search_vector);

-- Seed default categories
INSERT INTO forum_categories (name, slug, description, sort_order) VALUES
  ('General', 'general', 'General Solana development discussions', 1),
  ('Help', 'help', 'Ask questions and get help from the community', 2),
  ('Showcase', 'showcase', 'Share your projects and achievements', 3),
  ('Off-Topic', 'off-topic', 'Everything else', 4);
