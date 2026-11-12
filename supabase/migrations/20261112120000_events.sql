-- Events and workshops a learner attended.
--
-- An admin creates an event on Admin > Events with a redeem code that only works
-- between `starts_at` and `ends_at`. Each event is deployed as an on-chain
-- achievement type (`achievement_id`, `event-…`), so redeeming the code queues the
-- same `achievement` award the course achievements use: a soulbound Metaplex Core
-- NFT plus the event's XP, recorded in user_achievements by the queue and the
-- webhook. `event_attendances` is the redemption itself, written the moment the
-- code is accepted, so the badge shows before the mint lands.
--
-- Both tables are service_role-only: the code is a secret while the event runs,
-- and every write goes through /api/admin/events or /api/events/redeem.
-- `public_events` exposes everything except the code; `public_event_badges` is
-- the attendance list for public, non-deleted profiles, filtered like
-- public_profiles.
--
-- Artwork lives in the public `event-images` bucket. There are no storage
-- policies for it: uploads go through the admin route with the service role.
--
-- Additive and idempotent. No data change on apply.

BEGIN;

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- On-chain AchievementType id: seeds the PDA, at most 32 bytes.
  achievement_id TEXT NOT NULL UNIQUE
    CHECK (achievement_id ~ '^event-[a-z0-9-]{1,26}$'),
  -- Copied into the on-chain type and every NFT it mints (64-byte limit).
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 64),
  description TEXT NOT NULL DEFAULT ''
    CHECK (char_length(description) <= 1000),
  image_url TEXT,
  xp_reward INTEGER NOT NULL CHECK (xp_reward BETWEEN 1 AND 500),
  code TEXT NOT NULL CHECK (code ~ '^[A-Z0-9-]{4,32}$'),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  collection_address TEXT,
  deploy_tx TEXT,
  deployed_at TIMESTAMPTZ,
  CONSTRAINT events_window_check CHECK (ends_at > starts_at)
);

-- Codes are stored upper-case and compared that way, so one index covers both.
CREATE UNIQUE INDEX IF NOT EXISTS events_code_key ON public.events (code);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.events FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.event_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_attendances_once UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendances_user
  ON public.event_attendances (user_id);

ALTER TABLE public.event_attendances ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.event_attendances FROM anon, authenticated;
GRANT SELECT ON public.event_attendances TO authenticated;

DROP POLICY IF EXISTS "Users read their own event attendances"
  ON public.event_attendances;
CREATE POLICY "Users read their own event attendances"
  ON public.event_attendances FOR SELECT
  USING (auth.uid() = user_id);

-- Everything about an event except its code.
CREATE OR REPLACE VIEW public.public_events AS
SELECT
  e.id,
  e.achievement_id,
  e.name,
  e.description,
  e.image_url,
  e.xp_reward,
  e.starts_at,
  e.ends_at
FROM public.events e;

REVOKE ALL ON public.public_events FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.public_events TO anon, authenticated;

-- Attendance for public, non-deleted profiles only, same filters as
-- public_profiles.
CREATE OR REPLACE VIEW public.public_event_badges AS
SELECT
  a.user_id,
  a.redeemed_at,
  e.id AS event_id,
  e.achievement_id,
  e.name,
  e.description,
  e.image_url,
  e.starts_at,
  e.ends_at
FROM public.event_attendances a
JOIN public.events e ON e.id = a.event_id
JOIN public.profiles p ON p.id = a.user_id
WHERE p.is_public = true
  AND p.deleted_at IS NULL;

REVOKE ALL ON public.public_event_badges FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.public_event_badges TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

COMMIT;
