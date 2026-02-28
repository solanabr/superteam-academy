ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC) WHERE is_public = true;
