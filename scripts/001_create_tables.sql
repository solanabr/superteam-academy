-- Superteam Academy Database Schema
-- This creates all tables needed for the learning platform

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  wallet_address text unique,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- User Progress table (tracks XP, levels, streaks)
create table if not exists public.user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_xp integer default 0,
  level integer default 1,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

-- Courses table (managed via Sanity CMS, cached here)
create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  sanity_id text unique not null,
  title text not null,
  slug text unique not null,
  description text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  category text,
  thumbnail_url text,
  estimated_hours integer,
  is_published boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Lessons table (managed via Sanity CMS, cached here)
create table if not exists public.lessons (
  id uuid primary key default uuid_generate_v4(),
  sanity_id text unique not null,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  content_type text check (content_type in ('video', 'article', 'interactive', 'quiz')),
  xp_reward integer default 0,
  order_index integer not null,
  estimated_minutes integer,
  is_published boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(course_id, slug)
);

-- Enrollments table (user course enrollments - STUBBED for MVP)
create table if not exists public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  progress_percentage integer default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  unique(user_id, course_id)
);

-- Lesson Completions table (tracks completed lessons - STUBBED for MVP)
create table if not exists public.lesson_completions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  enrollment_id uuid references public.enrollments(id) on delete cascade,
  completed_at timestamp with time zone default now(),
  xp_earned integer default 0,
  quiz_score integer,
  unique(user_id, lesson_id)
);

-- Achievements table
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  title text not null,
  description text,
  icon text,
  xp_threshold integer,
  created_at timestamp with time zone default now()
);

-- User Achievements table
create table if not exists public.user_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamp with time zone default now(),
  unique(user_id, achievement_id)
);

-- Community Posts table
create table if not exists public.community_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  category text,
  upvotes integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Community Comments table
create table if not exists public.community_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;

-- RLS Policies for profiles
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- RLS Policies for user_progress
create policy "progress_select_all" on public.user_progress for select using (true);
create policy "progress_insert_own" on public.user_progress for insert with check (auth.uid() = user_id);
create policy "progress_update_own" on public.user_progress for update using (auth.uid() = user_id);
create policy "progress_delete_own" on public.user_progress for delete using (auth.uid() = user_id);

-- RLS Policies for courses (public read, admin write)
create policy "courses_select_all" on public.courses for select using (is_published = true or auth.uid() is not null);

-- RLS Policies for lessons (public read, admin write)
create policy "lessons_select_all" on public.lessons for select using (is_published = true or auth.uid() is not null);

-- RLS Policies for enrollments
create policy "enrollments_select_own" on public.enrollments for select using (auth.uid() = user_id);
create policy "enrollments_insert_own" on public.enrollments for insert with check (auth.uid() = user_id);
create policy "enrollments_update_own" on public.enrollments for update using (auth.uid() = user_id);
create policy "enrollments_delete_own" on public.enrollments for delete using (auth.uid() = user_id);

-- RLS Policies for lesson_completions
create policy "completions_select_own" on public.lesson_completions for select using (auth.uid() = user_id);
create policy "completions_insert_own" on public.lesson_completions for insert with check (auth.uid() = user_id);
create policy "completions_update_own" on public.lesson_completions for update using (auth.uid() = user_id);
create policy "completions_delete_own" on public.lesson_completions for delete using (auth.uid() = user_id);

-- RLS Policies for achievements
create policy "achievements_select_all" on public.achievements for select using (true);

-- RLS Policies for user_achievements
create policy "user_achievements_select_all" on public.user_achievements for select using (true);
create policy "user_achievements_insert_own" on public.user_achievements for insert with check (auth.uid() = user_id);

-- RLS Policies for community_posts
create policy "posts_select_all" on public.community_posts for select using (true);
create policy "posts_insert_own" on public.community_posts for insert with check (auth.uid() = user_id);
create policy "posts_update_own" on public.community_posts for update using (auth.uid() = user_id);
create policy "posts_delete_own" on public.community_posts for delete using (auth.uid() = user_id);

-- RLS Policies for community_comments
create policy "comments_select_all" on public.community_comments for select using (true);
create policy "comments_insert_own" on public.community_comments for insert with check (auth.uid() = user_id);
create policy "comments_update_own" on public.community_comments for update using (auth.uid() = user_id);
create policy "comments_delete_own" on public.community_comments for delete using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists idx_profiles_wallet on public.profiles(wallet_address);
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_user_progress_user_id on public.user_progress(user_id);
create index if not exists idx_courses_slug on public.courses(slug);
create index if not exists idx_courses_sanity_id on public.courses(sanity_id);
create index if not exists idx_lessons_course_id on public.lessons(course_id);
create index if not exists idx_lessons_slug on public.lessons(slug);
create index if not exists idx_enrollments_user_id on public.enrollments(user_id);
create index if not exists idx_enrollments_course_id on public.enrollments(course_id);
create index if not exists idx_lesson_completions_user_id on public.lesson_completions(user_id);
create index if not exists idx_lesson_completions_lesson_id on public.lesson_completions(lesson_id);
create index if not exists idx_community_posts_user_id on public.community_posts(user_id);
create index if not exists idx_community_comments_post_id on public.community_comments(post_id);
