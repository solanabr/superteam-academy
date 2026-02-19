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
  tx_signature TEXT
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
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT
) RETURNS void AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
  v_new_longest INTEGER;
BEGIN
  INSERT INTO xp_transactions (user_id, amount, reason)
  VALUES (p_user_id, p_amount, p_reason);

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
  p_achievement_id TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO user_achievements (user_id, achievement_id)
  VALUES (p_user_id, p_achievement_id)
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
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
  action_type    TEXT NOT NULL CHECK (action_type IN ('achievement', 'certificate', 'course_finalize', 'xp')),
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
