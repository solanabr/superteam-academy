-- ============================================
-- Superteam Academy - Initial Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'professor', 'student');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE course_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE lesson_type AS ENUM ('content', 'challenge', 'quiz', 'video');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'achievement');

-- ============================================
-- TABLES
-- ============================================

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  name TEXT,
  image TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'student',
  wallet_address TEXT UNIQUE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  difficulty course_difficulty NOT NULL DEFAULT 'beginner',
  duration INTEGER NOT NULL DEFAULT 0, -- in minutes
  xp INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status course_status NOT NULL DEFAULT 'draft',
  prerequisites UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modules
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type lesson_type NOT NULL DEFAULT 'content',
  content TEXT NOT NULL DEFAULT '',
  "order" INTEGER NOT NULL DEFAULT 0,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- Progress
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  score INTEGER,
  UNIQUE(user_id, lesson_id)
);

-- Streaks
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Achievements (junction)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_progress_course ON progress(course_id);
CREATE INDEX idx_comments_lesson ON comments(lesson_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read = FALSE;
CREATE INDEX idx_users_xp ON users(xp DESC);
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Admin: full access
CREATE POLICY "admin_all_users" ON users
  FOR ALL TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

-- Users: read/update own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Public profiles (name, image, xp, level)
CREATE POLICY "users_public_read" ON users
  FOR SELECT TO anon
  USING (TRUE);

-- ============================================
-- COURSES POLICIES
-- ============================================

-- Admin: full access to all courses
CREATE POLICY "admin_all_courses" ON courses
  FOR ALL TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

-- Professor: CRUD own courses
CREATE POLICY "professor_own_courses" ON courses
  FOR ALL TO authenticated
  USING (auth.user_role() = 'professor' AND instructor_id = auth.uid())
  WITH CHECK (auth.user_role() = 'professor' AND instructor_id = auth.uid());

-- Everyone: read published courses
CREATE POLICY "public_read_published_courses" ON courses
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- ============================================
-- MODULES POLICIES
-- ============================================

CREATE POLICY "admin_all_modules" ON modules
  FOR ALL TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "professor_own_modules" ON modules
  FOR ALL TO authenticated
  USING (
    auth.user_role() = 'professor'
    AND course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
  )
  WITH CHECK (
    auth.user_role() = 'professor'
    AND course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
  );

CREATE POLICY "public_read_modules" ON modules
  FOR SELECT TO anon, authenticated
  USING (course_id IN (SELECT id FROM courses WHERE status = 'published'));

-- ============================================
-- LESSONS POLICIES
-- ============================================

CREATE POLICY "admin_all_lessons" ON lessons
  FOR ALL TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "professor_own_lessons" ON lessons
  FOR ALL TO authenticated
  USING (
    auth.user_role() = 'professor'
    AND module_id IN (
      SELECT m.id FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE c.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.user_role() = 'professor'
    AND module_id IN (
      SELECT m.id FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "public_read_lessons" ON lessons
  FOR SELECT TO anon, authenticated
  USING (
    module_id IN (
      SELECT m.id FROM modules m
      JOIN courses c ON m.course_id = c.id
      WHERE c.status = 'published'
    )
  );

-- ============================================
-- ENROLLMENTS POLICIES
-- ============================================

CREATE POLICY "admin_all_enrollments" ON enrollments
  FOR ALL TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

-- Professor: read enrollments for their courses
CREATE POLICY "professor_read_enrollments" ON enrollments
  FOR SELECT TO authenticated
  USING (
    auth.user_role() = 'professor'
    AND course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
  );

-- Student: enroll self, read own
CREATE POLICY "student_own_enrollments" ON enrollments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "student_enroll" ON enrollments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- PROGRESS POLICIES
-- ============================================

CREATE POLICY "admin_all_progress" ON progress
  FOR ALL TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "professor_read_student_progress" ON progress
  FOR SELECT TO authenticated
  USING (
    auth.user_role() = 'professor'
    AND course_id IN (SELECT id FROM courses WHERE instructor_id = auth.uid())
  );

CREATE POLICY "student_own_progress" ON progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- STREAKS POLICIES
-- ============================================

CREATE POLICY "admin_all_streaks" ON streaks
  FOR ALL TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "user_own_streak" ON streaks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- ACHIEVEMENTS POLICIES
-- ============================================

CREATE POLICY "admin_manage_achievements" ON achievements
  FOR ALL TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "public_read_achievements" ON achievements
  FOR SELECT TO anon, authenticated
  USING (TRUE);

-- ============================================
-- USER_ACHIEVEMENTS POLICIES
-- ============================================

CREATE POLICY "admin_all_user_achievements" ON user_achievements
  FOR ALL TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "user_own_achievements" ON user_achievements
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- COMMENTS POLICIES
-- ============================================

CREATE POLICY "admin_all_comments" ON comments
  FOR ALL TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "authenticated_read_comments" ON comments
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "authenticated_create_comments" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_update_own_comments" ON comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_delete_own_comments" ON comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

CREATE POLICY "admin_all_notifications" ON notifications
  FOR ALL TO authenticated
  USING (auth.user_role() = 'admin')
  WITH CHECK (auth.user_role() = 'admin');

CREATE POLICY "user_own_notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
