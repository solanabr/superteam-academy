-- Users (extended by NextAuth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  social_links JSONB DEFAULT '{}',
  wallet_address TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  achievements BYTEA DEFAULT E'\\x00'::bytea,
  preferred_language TEXT DEFAULT 'en',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course progress
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  course_id TEXT NOT NULL,
  progress_bitmap BYTEA DEFAULT E'\\x00'::bytea,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- XP transaction audit log
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streak history
CREATE TABLE streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  lessons_completed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;
