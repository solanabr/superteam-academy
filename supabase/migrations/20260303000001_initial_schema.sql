create extension if not exists "uuid-ossp";

-- Courses table
create table if not exists courses (
  id text primary key,
  slug text unique not null,
  title text not null,
  description text,
  category text default 'solana',
  difficulty text check (difficulty in ('beginner','intermediate','advanced')) default 'beginner',
  lesson_count integer default 5,
  duration_minutes integer default 60,
  xp_reward integer default 250,
  order_index integer default 0,
  is_published boolean default false,
  thumbnail_url text,
  instructor text,
  created_at timestamptz default now()
);

-- Insert sample courses
insert into courses (id, slug, title, description, category, difficulty, lesson_count, duration_minutes, xp_reward, order_index, is_published) values
('solana-fundamentals', 'solana-fundamentals', 'Solana Fundamentals', 'Learn the basics of Solana blockchain development', 'solana', 'beginner', 12, 180, 1200, 1, true),
('anchor-development', 'anchor-development', 'Anchor Development', 'Build Solana programs with Anchor framework', 'solana', 'intermediate', 16, 240, 2400, 2, true),
('token-engineering', 'token-engineering', 'Token Engineering', 'Master Token-2022 and soulbound tokens', 'solana', 'advanced', 10, 150, 2000, 3, true)
on conflict (id) do nothing;

create table if not exists threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_wallet text not null,
  author_name text,
  author_avatar text,
  locale text default 'en',
  tags text[] default '{}',
  upvotes integer default 0,
  views integer default 0,
  is_pinned boolean default false,
  is_solved boolean default false,
  bounty_usdc numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references threads(id) on delete cascade,
  body text not null,
  author_wallet text not null,
  author_name text,
  author_avatar text,
  upvotes integer default 0,
  is_accepted boolean default false,
  created_at timestamptz default now()
);

create table if not exists upvotes (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null,
  target_type text not null check (target_type in ('thread','reply')),
  voter_wallet text not null,
  created_at timestamptz default now(),
  unique(target_id, voter_wallet)
);

create table if not exists practice_challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  difficulty text check (difficulty in ('beginner','intermediate','advanced')) default 'beginner',
  category text not null,
  xp_reward integer default 50,
  starter_code text,
  test_cases jsonb default '[]',
  hints jsonb default '[]',
  order_index integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references practice_challenges(id),
  user_wallet text not null,
  code text not null,
  passed boolean default false,
  score integer default 0,
  created_at timestamptz default now()
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  user_wallet text not null,
  course_id text not null,
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  progress integer default 0,
  tx_signature text,
  unique(user_wallet, course_id)
);

create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  wallet text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  xp integer default 0,
  level integer default 1,
  streak integer default 0,
  locale text default 'en',
  psychometric_result jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_wallet text not null,
  amount integer not null,
  reason text not null,
  tx_signature text,
  created_at timestamptz default now()
);

alter table threads enable row level security;
alter table replies enable row level security;
alter table upvotes enable row level security;
alter table practice_challenges enable row level security;
alter table challenge_attempts enable row level security;
alter table enrollments enable row level security;
alter table user_profiles enable row level security;

create policy "read_threads" on threads for select using (true);
create policy "read_replies" on replies for select using (true);
create policy "read_challenges" on practice_challenges for select using (is_active=true);
create policy "read_profiles" on user_profiles for select using (true);
create policy "insert_threads" on threads for insert with check (true);
create policy "insert_replies" on replies for insert with check (true);
create policy "insert_upvotes" on upvotes for insert with check (true);
create policy "insert_attempts" on challenge_attempts for insert with check (true);
create policy "insert_enrollments" on enrollments for insert with check (true);
create policy "all_profiles" on user_profiles for all using (true);
create policy "insert_xp" on xp_transactions for insert with check (true);

create index idx_threads_created on threads(created_at desc);
create index idx_replies_thread on replies(thread_id);
create index idx_attempts_wallet on challenge_attempts(user_wallet);
create index idx_profiles_wallet on user_profiles(wallet);

-- Quiz Questions table
create table if not exists quiz_questions (
  id text primary key,
  question text not null,
  options text[] not null,
  correct_index integer not null,
  explanation text,
  category text default 'solana',
  difficulty text check (difficulty in ('beginner','intermediate','advanced')) default 'beginner',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Achievements table
create table if not exists achievements (
  id text primary key,
  title text not null,
  description text,
  icon text,
  rarity text check (rarity in ('common','rare','epic','legendary')) default 'common',
  xp_reward integer default 50,
  created_at timestamptz default now()
);

-- Insert sample quiz questions
insert into quiz_questions (id, question, options, correct_index, category, difficulty) values
('q1', 'What is a Solana Program?', '["A smart contract","A wallet","A token","A block"],' 0, 'solana', 'beginner'),
('q2', 'What is Anchor?', '["A Solana framework","A wallet","A token standard","A blockchain"],' 0, 'solana', 'beginner'),
('q3', 'What is a PDA?', '["Program Derived Address","Public Data Account","Private Data Array","Program Data Asset"],' 0, 'solana', 'intermediate')
on conflict (id) do nothing;

-- Insert sample achievements
insert into achievements (id, title, description, icon, rarity, xp_reward) values
('first-lesson', 'First Steps', 'Complete your first lesson', '🎯', 'common', 50),
('week-streak', 'Week Warrior', 'Maintain a 7-day streak', '🔥', 'rare', 200),
('course-complete', 'Course Completer', 'Complete your first course', '🏆', 'epic', 500)
on conflict (id) do nothing;
