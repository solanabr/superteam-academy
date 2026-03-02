-- Achievement certificates minted on Devnet

create table if not exists public.user_achievement_certificates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  wallet_address text not null,
  mint_address text not null unique,
  signature text not null,
  network text not null default 'devnet',
  issued_at timestamp with time zone default now(),
  unique(user_id, achievement_id)
);

alter table public.user_achievement_certificates enable row level security;

create policy "user_achievement_certificates_select_own"
  on public.user_achievement_certificates
  for select
  using (auth.uid() = user_id);

create policy "user_achievement_certificates_insert_own"
  on public.user_achievement_certificates
  for insert
  with check (auth.uid() = user_id);

create index if not exists idx_user_achievement_certificates_user_achievement
  on public.user_achievement_certificates(user_id, achievement_id);
