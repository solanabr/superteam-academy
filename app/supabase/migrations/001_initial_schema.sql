-- Superteam Academy - Initial Schema
-- Tables: profiles, streaks, activity_log, leaderboard_cache, course_progress, forum_threads, forum_replies, user_settings

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  wallet_address text unique,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  github_username text,
  twitter_handle text,
  preferred_locale text default 'en' check (preferred_locale in ('en', 'pt-BR', 'es')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Streaks
create table public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak int default 0 not null,
  longest_streak int default 0 not null,
  last_activity_date date default current_date not null,
  streak_start_date date default current_date not null
);

alter table public.streaks enable row level security;

create policy "Users can view own streaks"
  on public.streaks for select using (auth.uid() = user_id);

create policy "Users can update own streaks"
  on public.streaks for update using (auth.uid() = user_id);

create policy "Users can insert own streaks"
  on public.streaks for insert with check (auth.uid() = user_id);

-- Activity Log
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null check (action in (
    'lesson_completed', 'course_enrolled', 'course_finalized',
    'credential_issued', 'achievement_earned', 'xp_earned'
  )),
  metadata jsonb default '{}' not null,
  created_at timestamptz default now() not null
);

alter table public.activity_log enable row level security;

create policy "Users can view own activity"
  on public.activity_log for select using (auth.uid() = user_id);

create policy "Users can insert own activity"
  on public.activity_log for insert with check (auth.uid() = user_id);

create index idx_activity_log_user_date on public.activity_log(user_id, created_at desc);

-- Leaderboard Cache
create table public.leaderboard_cache (
  wallet_address text primary key,
  xp_balance bigint default 0 not null,
  level int default 0 not null,
  rank int default 0 not null,
  updated_at timestamptz default now() not null
);

alter table public.leaderboard_cache enable row level security;

create policy "Leaderboard is viewable by everyone"
  on public.leaderboard_cache for select using (true);

create index idx_leaderboard_rank on public.leaderboard_cache(rank asc);
create index idx_leaderboard_xp on public.leaderboard_cache(xp_balance desc);

-- Course Progress
create table public.course_progress (
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id text not null,
  enrollment_pda text not null,
  completed_lessons int default 0 not null,
  total_lessons int not null,
  is_finalized boolean default false not null,
  credential_address text,
  started_at timestamptz default now() not null,
  completed_at timestamptz,
  primary key (user_id, course_id)
);

alter table public.course_progress enable row level security;

create policy "Users can view own progress"
  on public.course_progress for select using (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.course_progress for update using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.course_progress for insert with check (auth.uid() = user_id);

-- Forum Threads
create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id text,
  title text not null,
  body text not null,
  is_solved boolean default false not null,
  reply_count int default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.forum_threads enable row level security;

create policy "Threads are viewable by everyone"
  on public.forum_threads for select using (true);

create policy "Authenticated users can create threads"
  on public.forum_threads for insert with check (auth.uid() = user_id);

create policy "Users can update own threads"
  on public.forum_threads for update using (auth.uid() = user_id);

create index idx_forum_threads_course on public.forum_threads(course_id, created_at desc);

-- Forum Replies
create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.forum_threads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  is_solution boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.forum_replies enable row level security;

create policy "Replies are viewable by everyone"
  on public.forum_replies for select using (true);

create policy "Authenticated users can create replies"
  on public.forum_replies for insert with check (auth.uid() = user_id);

create policy "Users can update own replies"
  on public.forum_replies for update using (auth.uid() = user_id);

create index idx_forum_replies_thread on public.forum_replies(thread_id, created_at asc);

-- User Settings
create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_notifications boolean default true not null,
  push_notifications boolean default false not null,
  theme text default 'dark' check (theme in ('dark', 'light', 'system')) not null,
  updated_at timestamptz default now() not null
);

alter table public.user_settings enable row level security;

create policy "Users can view own settings"
  on public.user_settings for select using (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert with check (auth.uid() = user_id);

-- Auto-create profile + streak + settings on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'preferred_username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.streaks (user_id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger forum_threads_updated_at
  before update on public.forum_threads
  for each row execute function public.update_updated_at();

create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.update_updated_at();

-- Increment reply count on forum_replies insert
create or replace function public.increment_reply_count()
returns trigger as $$
begin
  update public.forum_threads
  set reply_count = reply_count + 1
  where id = new.thread_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_reply_created
  after insert on public.forum_replies
  for each row execute function public.increment_reply_count();
