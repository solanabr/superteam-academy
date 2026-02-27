-- Community tables for threads, replies, and votes

CREATE TABLE IF NOT EXISTS threads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  author_wallet text NOT NULL,
  course_id text,
  category text DEFAULT 'general' CHECK (category IN ('general', 'help', 'showcase', 'feedback')),
  is_answered boolean DEFAULT false,
  upvotes int DEFAULT 0,
  reply_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_wallet text NOT NULL,
  is_accepted_answer boolean DEFAULT false,
  upvotes int DEFAULT 0,
  parent_reply_id uuid REFERENCES replies(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_wallet text NOT NULL,
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES replies(id) ON DELETE CASCADE,
  vote_type text DEFAULT 'up',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_wallet, thread_id),
  UNIQUE(user_wallet, reply_id)
);

CREATE INDEX IF NOT EXISTS idx_threads_course ON threads(course_id);
CREATE INDEX IF NOT EXISTS idx_threads_category ON threads(category);
CREATE INDEX IF NOT EXISTS idx_replies_thread ON replies(thread_id);
