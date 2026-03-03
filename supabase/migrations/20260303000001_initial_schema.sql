create extension if not exists "uuid-ossp";

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
