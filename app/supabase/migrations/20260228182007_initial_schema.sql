-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,
  google_id TEXT UNIQUE,
  github_id TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  twitter_handle TEXT,
  github_handle TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, provider_id)
);

CREATE TABLE IF NOT EXISTS streaks (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  streak_history JSONB DEFAULT '[]'
);

-- ─── Forum ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_categories (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#666666',
  order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id INT REFERENCES forum_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_wallet TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_answered BOOLEAN,
  is_pinned BOOLEAN DEFAULT false,
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_wallet TEXT,
  body TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  voter_wallet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(thread_id, voter_wallet)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_threads_category ON forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_threads_created ON forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replies_thread ON forum_replies(thread_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "public_read_profiles" ON profiles FOR SELECT USING (is_public = true);
CREATE POLICY "public_read_categories" ON forum_categories FOR SELECT USING (true);
CREATE POLICY "public_read_threads" ON forum_threads FOR SELECT USING (true);
CREATE POLICY "public_read_replies" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "public_read_votes" ON forum_votes FOR SELECT USING (true);

-- Anyone with wallet can write (anon key — we trust wallet auth)
CREATE POLICY "anon_insert_threads" ON forum_threads FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_replies" ON forum_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert_votes" ON forum_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_upsert_profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE USING (true);

-- ─── Seed categories ──────────────────────────────────────────────────────────
INSERT INTO forum_categories (slug, label, description, color, order_index) VALUES
  ('general', 'General Discussion', 'Anything Solana and academy related', '#666666', 1),
  ('solana-basics', 'Solana Basics', 'Questions about accounts, transactions, programs', '#14F195', 2),
  ('anchor-framework', 'Anchor Framework', 'PDAs, CPIs, constraints, error handling', '#9945FF', 3),
  ('defi-amms', 'DeFi & AMMs', 'Liquidity pools, swaps, protocol design', '#F1C40F', 4),
  ('security', 'Security', 'Auditing, exploits, secure patterns', '#E74C3C', 5),
  ('showcase', 'Showcase', 'Share what you built', '#3498DB', 6)
ON CONFLICT (slug) DO NOTHING;

-- ─── Seed sample threads ──────────────────────────────────────────────────────
INSERT INTO forum_threads (category_id, author_wallet, title, body, is_answered, views, created_at) VALUES
  (3, '7xKp...3mRt', 'How do I derive a PDA with multiple seeds?', 'I am trying to derive a PDA using both a user pubkey and a string seed. My code fails with "Invalid seeds". What am I missing?', true, 234, now() - interval '2 hours'),
  (2, '9Bw2...8nLq', 'Getting ''Account not found'' error on devnet — help!', 'I deployed my program to devnet and when I try to call initialize I get AccountNotFound. The account should be created by the instruction...', false, 89, now() - interval '45 minutes'),
  (6, '3dFy...5kJv', 'Showcase: Built a token vesting program using this course!', 'Just finished the Anchor module and immediately applied it — built a simple token vesting program with cliffs and linear release. Here is the repo.', null, 312, now() - interval '1 day'),
  (3, 'Aq1R...7hZe', 'Best practices for CPI error handling?', 'When my CPI fails, the error from the called program is not very descriptive. How do you handle and surface CPI errors properly in Anchor?', true, 445, now() - interval '3 days'),
  (4, '6sNp...2wMc', 'Token-2022 transfer hooks — where to start?', 'The transfer hook extension seems powerful but the docs are sparse. Has anyone implemented one? Looking for a minimal example.', false, 67, now() - interval '5 hours'),
  (5, 'Bq3T...9rWx', 'Common reentrancy patterns in Solana AMMs', 'Let''s compile a list of reentrancy attack vectors specific to Solana AMMs. I''ll start: flash loan + CPI callback...', true, 567, now() - interval '5 days')
ON CONFLICT DO NOTHING;
