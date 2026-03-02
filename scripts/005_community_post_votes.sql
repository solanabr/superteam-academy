-- Community Post Votes
-- Run this in Supabase SQL editor to support upvote toggle without duplicate voting.

create table if not exists public.community_post_votes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(post_id, user_id)
);

alter table public.community_post_votes enable row level security;

create policy "post_votes_select_all"
on public.community_post_votes
for select
using (true);

create policy "post_votes_insert_own"
on public.community_post_votes
for insert
with check (auth.uid() = user_id);

create policy "post_votes_delete_own"
on public.community_post_votes
for delete
using (auth.uid() = user_id);

create index if not exists idx_community_post_votes_post_id
on public.community_post_votes(post_id);

create index if not exists idx_community_post_votes_user_id
on public.community_post_votes(user_id);
