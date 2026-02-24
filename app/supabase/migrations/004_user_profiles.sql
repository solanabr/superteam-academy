-- User profiles for display name, bio, and settings persistence
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,          -- wallet address or OAuth sub
  display_name TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT true,
  show_on_leaderboard BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public read for public profiles
CREATE POLICY "Public profiles readable" ON user_profiles
  FOR SELECT USING (is_public = true);

-- Service role has full access (API routes use service role key)
CREATE POLICY "Service role full access" ON user_profiles
  FOR ALL USING (true) WITH CHECK (true);
