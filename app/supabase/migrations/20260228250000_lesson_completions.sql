CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  course_title TEXT,
  lesson_id TEXT NOT NULL,
  lesson_title TEXT,
  xp_earned INT DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wallet_address, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_completions_wallet ON lesson_completions(wallet_address, completed_at DESC);

ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_completions" ON lesson_completions FOR SELECT USING (true);
CREATE POLICY "anon_insert_completions" ON lesson_completions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_upsert_completions" ON lesson_completions FOR UPDATE USING (true);
