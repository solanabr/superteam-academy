create extension if not exists pgcrypto;

create table if not exists academy_users (
  id uuid primary key default gen_random_uuid(),
  learner_id text unique not null,
  display_name text,
  email text,
  wallet_address text,
  auth_method text not null default 'wallet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists academy_linked_accounts (
  id uuid primary key default gen_random_uuid(),
  learner_id text not null references academy_users(learner_id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  wallet_address text,
  metadata jsonb not null default '{}'::jsonb,
  linked_at timestamptz not null default now(),
  unique (learner_id, provider),
  unique (provider, provider_user_id)
);

create table if not exists academy_enrollments (
  id uuid primary key default gen_random_uuid(),
  learner_id text not null references academy_users(learner_id) on delete cascade,
  course_id text not null,
  tx_signature text,
  source text not null default 'wallet',
  enrolled_at timestamptz not null default now(),
  unique (learner_id, course_id)
);

create table if not exists academy_lesson_completions (
  id uuid primary key default gen_random_uuid(),
  learner_id text not null references academy_users(learner_id) on delete cascade,
  course_id text not null,
  lesson_id text not null,
  xp_earned integer not null default 0,
  completed_at timestamptz not null default now(),
  unique (learner_id, course_id, lesson_id)
);

create table if not exists academy_streak_days (
  id uuid primary key default gen_random_uuid(),
  learner_id text not null references academy_users(learner_id) on delete cascade,
  activity_day date not null,
  created_at timestamptz not null default now(),
  unique (learner_id, activity_day)
);

create table if not exists academy_activity_feed (
  id uuid primary key default gen_random_uuid(),
  learner_id text not null references academy_users(learner_id) on delete cascade,
  event_type text not null,
  course_id text,
  lesson_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists academy_user_profiles (
  learner_id text primary key references academy_users(learner_id) on delete cascade,
  username text unique,
  avatar_url text,
  bio text,
  country text,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists academy_profile_visibility (
  learner_id text primary key references academy_users(learner_id) on delete cascade,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Migration safety for existing databases:
alter table if exists academy_user_profiles add column if not exists avatar_url text;
alter table if exists academy_user_profiles drop column if exists full_name;

create table if not exists academy_leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  window_key text not null,
  learner_id text not null references academy_users(learner_id) on delete cascade,
  wallet text,
  display_name text,
  xp integer not null default 0,
  rank integer not null default 0,
  captured_at timestamptz not null default now(),
  unique (window_key, learner_id, captured_at)
);

create index if not exists idx_academy_enrollments_learner on academy_enrollments (learner_id);
create index if not exists idx_academy_completions_learner on academy_lesson_completions (learner_id, course_id);
create index if not exists idx_academy_feed_learner on academy_activity_feed (learner_id, created_at desc);
create index if not exists idx_academy_streak_learner on academy_streak_days (learner_id, activity_day desc);
create index if not exists idx_academy_user_profiles_username on academy_user_profiles (username);
create index if not exists idx_academy_profile_visibility_public on academy_profile_visibility (is_public);
create index if not exists idx_academy_leaderboard_window on academy_leaderboard_snapshots (window_key, captured_at desc);
create index if not exists idx_academy_users_wallet on academy_users (wallet_address);
create index if not exists idx_academy_users_email on academy_users (email);
create index if not exists idx_academy_linked_accounts_learner_provider on academy_linked_accounts (learner_id, provider);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'academy_users_auth_method_check'
  ) then
    alter table academy_users
      add constraint academy_users_auth_method_check
      check (auth_method in ('supabase', 'wallet', 'github'));
  end if;
end $$;

-- Avatar storage bucket + policies
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'avatars') then
    insert into storage.buckets (id, name, public)
    values ('avatars', 'avatars', true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Avatar images are publicly readable'
  ) then
    create policy "Avatar images are publicly readable"
      on storage.objects
      for select
      using (bucket_id = 'avatars');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload avatars'
  ) then
    create policy "Authenticated users can upload avatars"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'avatars');
  end if;
end $$;
