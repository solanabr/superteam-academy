-- =============================================================================
-- Superteam Academy: Course, Module, Lesson tables
-- Run this in Supabase SQL Editor after the existing schema.sql (threads/replies/votes)
-- =============================================================================

-- ── Trigger function for updated_at ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Courses ──────────────────────────────────────────────────────────────────
CREATE TABLE courses (
  id                text PRIMARY KEY,                -- e.g. "intro-solana"
  slug              text UNIQUE NOT NULL,            -- e.g. "intro-to-solana"
  title             text NOT NULL,
  description       text NOT NULL DEFAULT '',
  long_description  text DEFAULT '',
  track             text NOT NULL CHECK (track IN ('rust', 'anchor', 'frontend', 'security', 'defi', 'mobile')),
  difficulty        text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  lesson_count      int NOT NULL DEFAULT 0,
  duration          text NOT NULL DEFAULT '',         -- e.g. "4 hours"
  xp_reward         int NOT NULL DEFAULT 0,
  estimated_hours   numeric DEFAULT 0,
  creator           text NOT NULL DEFAULT '',
  prerequisite_id   text REFERENCES courses(id) ON DELETE SET NULL,
  is_active         boolean NOT NULL DEFAULT true,
  published         boolean NOT NULL DEFAULT false,
  learning_outcomes text[] DEFAULT '{}',
  total_completions int NOT NULL DEFAULT 0,
  enrolled_count    int NOT NULL DEFAULT 0,
  image_url         text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_track ON courses(track);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_published_active ON courses(published, is_active);
CREATE INDEX idx_courses_slug ON courses(slug);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Modules ──────────────────────────────────────────────────────────────────
CREATE TABLE modules (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id   text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  "order"     int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_order ON modules(course_id, "order");

-- ── Lessons ──────────────────────────────────────────────────────────────────
CREATE TABLE lessons (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id             uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  slug                  text NOT NULL DEFAULT '',
  type                  text NOT NULL CHECK (type IN ('reading', 'video', 'challenge', 'quiz')),
  duration              text NOT NULL DEFAULT '',      -- e.g. "10 min"
  xp_reward             int NOT NULL DEFAULT 0,
  estimated_minutes     int NOT NULL DEFAULT 10,
  "order"               int NOT NULL DEFAULT 0,
  content               text DEFAULT '',               -- markdown body
  challenge_instructions text,
  challenge_starter_code text,
  challenge_solution     text,
  challenge_language     text,
  challenge_test_cases   jsonb,                         -- [{name, input, expectedOutput}]
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, "order");
CREATE INDEX idx_lessons_type ON lessons(type);

CREATE TRIGGER trg_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can read published + active courses and their children
CREATE POLICY "Public read published courses"
  ON courses FOR SELECT
  USING (published = true AND is_active = true);

CREATE POLICY "Public read modules of published courses"
  ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
        AND courses.published = true
        AND courses.is_active = true
    )
  );

CREATE POLICY "Public read lessons of published courses"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
        AND courses.published = true
        AND courses.is_active = true
    )
  );

-- Service role: full access for writes (inserts, updates, deletes)
-- The service_role key bypasses RLS by default in Supabase,
-- but we add explicit policies for completeness.
CREATE POLICY "Service role full access courses"
  ON courses FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access modules"
  ON modules FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access lessons"
  ON lessons FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
