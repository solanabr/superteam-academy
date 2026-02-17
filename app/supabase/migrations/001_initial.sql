-- Superteam Academy Database Schema
-- Run this file to drop and recreate all tables from scratch.

-- Clean slate
DROP TABLE IF EXISTS daily_challenge_completions CASCADE;
DROP TABLE IF EXISTS daily_challenges CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS xp_transactions CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;

-- Users (extended from NextAuth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE,
  display_name TEXT,
  email TEXT,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',
  wallet_address TEXT,
  is_public BOOLEAN DEFAULT true,
  preferred_language TEXT DEFAULT 'en',
  preferred_theme TEXT DEFAULT 'brazil',
  created_at TIMESTAMPTZ DEFAULT now(),
  email_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Linked OAuth / Wallet accounts (for cross-provider sign-in)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'oauth',
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user ON accounts(user_id);

-- XP & Gamification
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freezes INTEGER DEFAULT 3,
  courses_completed INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  achievement_flags BIGINT[] DEFAULT ARRAY[0,0,0,0]::BIGINT[],
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_pct FLOAT DEFAULT 0,
  lesson_flags BIGINT[] DEFAULT ARRAY[0,0,0,0]::BIGINT[],
  UNIQUE(user_id, course_id)
);

-- XP Transaction Log
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Community Posts
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  course_id TEXT,
  parent_id UUID REFERENCES community_posts(id),
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Challenges
CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL,
  challenge_data JSONB NOT NULL,
  xp_reward INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE daily_challenge_completions (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES daily_challenges(id),
  completed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, challenge_id)
);

-- Indexes
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created ON xp_transactions(created_at);
CREATE INDEX idx_community_posts_user ON community_posts(user_id);
CREATE INDEX idx_community_posts_course ON community_posts(course_id);
CREATE INDEX idx_community_posts_parent ON community_posts(parent_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY profiles_read ON profiles FOR SELECT USING (is_public = true OR id = auth.uid());
CREATE POLICY profiles_write ON profiles FOR UPDATE USING (id = auth.uid());

-- User stats: public read, service write
CREATE POLICY stats_read ON user_stats FOR SELECT USING (true);
CREATE POLICY stats_write ON user_stats FOR ALL USING (user_id = auth.uid());

-- Enrollments: own read/write
CREATE POLICY enrollments_read ON enrollments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY enrollments_write ON enrollments FOR ALL USING (user_id = auth.uid());

-- XP transactions: own read
CREATE POLICY xp_read ON xp_transactions FOR SELECT USING (user_id = auth.uid());

-- Community posts: public read, own write
CREATE POLICY posts_read ON community_posts FOR SELECT USING (true);
CREATE POLICY posts_write ON community_posts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY posts_update ON community_posts FOR UPDATE USING (user_id = auth.uid());

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_stats_updated_at BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER community_posts_updated_at BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage: avatars bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY avatars_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY avatars_service_insert ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY avatars_service_update ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars');
