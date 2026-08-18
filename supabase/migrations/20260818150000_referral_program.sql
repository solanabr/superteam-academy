-- ============================================================================
-- Migration: referral_program — seasonal referral points + leaderboard
--
-- A learner shares their link (?ref=<code>); when someone creates an account
-- through it the referrer earns 1 point, and 1 more for EVERY DISTINCT COURSE
-- that referred learner completes afterwards. Standings are per SEASON (a
-- 3-month window from the referral_seasons table); the org rewards the top
-- places each season, so the leaderboard is a prize surface and every write
-- guard below exists because points are worth money.
--
-- WHAT THIS ADDS
--   1. profiles.referral_code — the shareable code (8 lowercase hex chars,
--      minted lazily by get_or_create_referral_code).
--      profiles.referred_by  — who referred this account. Written EXACTLY once,
--      only by claim_referral, never self, never after the claim window.
--   2. referral_seasons — admin-managed season windows. Seeded with Season 1
--      starting at apply time, 3 months long. Public SELECT (the leaderboard
--      page shows the season and its end date).
--   3. referral_events — the point ledger. One row = one point. Partial UNIQUE
--      indexes make the two rules DATABASE invariants, not code conventions:
--        * one 'signup' point per referred account, ever;
--        * one 'course_completion' point per (referred account, course), ever —
--          a course re-take or a replayed webhook can never double-award.
--   4. Functions (all SECURITY DEFINER, search_path '', REVOKEd from
--      PUBLIC/anon/authenticated unless stated):
--        get_or_create_referral_code(UUID)            — service_role
--        claim_referral(UUID, TEXT)                   — service_role
--        record_referral_course_completion(UUID,TEXT) — service_role
--        get_referral_leaderboard(INT, INT)           — authenticated + anon
--                                                       (public read, mirrors
--                                                       get_leaderboard)
--
-- SECURITY MODEL (house pattern — #779 / reminder_consent):
--   * referral_events: RLS ON; the only policy is own-row SELECT as the
--     REFERRER (your own points are yours to see). All writes go through the
--     SECURITY DEFINER functions via service_role — a client can neither mint
--     points nor see who referred whom platform-wide.
--   * referral_seasons: RLS ON, public SELECT, no client writes.
--   * profiles.referral_code / referred_by: readable through the existing
--     own-row profiles SELECT. The self-service profiles UPDATE policy is
--     column-agnostic, so trg_enforce_referral_write below locks BOTH columns
--     against client tampering the same way the wallet write-lock does —
--     without it a learner could rewrite referred_by and redirect points.
--   * claim_referral guards: code must resolve, no self-referral, referred_by
--     write-once, and the referred account must be under 7 days old — an old
--     account "claiming" a code would mint a signup point for growth that
--     already happened.
--
-- Idempotent: ADD COLUMN/CREATE TABLE/INDEX IF NOT EXISTS, CREATE OR REPLACE
-- for functions, conditional constraint/trigger/policy creation.
-- ============================================================================

-- ── 1. profiles columns ─────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_profiles_referral_code'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT uq_profiles_referral_code UNIQUE (referral_code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_referral_code_shape'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_referral_code_shape
      CHECK (referral_code IS NULL OR referral_code ~ '^[a-f0-9]{8}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_no_self_referral'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT chk_profiles_no_self_referral
      CHECK (referred_by IS NULL OR referred_by <> id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by
  ON public.profiles(referred_by) WHERE referred_by IS NOT NULL;

-- Write-lock the two referral columns against the column-agnostic self-service
-- profiles UPDATE policy — the exact enforce_profile_wallet_write mechanism
-- (SECURITY INVOKER so current_user reflects the caller; privileged = the
-- service_role jwt claim or role). Without it a learner could rewrite
-- referred_by and redirect another season's points to themselves. INSERTs
-- coerce both columns back to NULL: the signup path never sets them.
CREATE OR REPLACE FUNCTION public.enforce_referral_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  jwt_role TEXT;
  is_privileged BOOLEAN;
BEGIN
  jwt_role := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role';
  is_privileged := COALESCE(current_user = 'service_role' OR jwt_role = 'service_role', false);

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.referral_code IS DISTINCT FROM OLD.referral_code
       OR NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
      RAISE EXCEPTION
        'permission denied: referral columns may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.referral_code := NULL;
    NEW.referred_by := NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_referral_write() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_referral_write ON public.profiles;
CREATE TRIGGER trg_enforce_referral_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_referral_write();

-- ── 2. referral_seasons ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.referral_seasons (
  number INTEGER PRIMARY KEY,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_referral_season_window CHECK (ends_at > starts_at)
);

ALTER TABLE public.referral_seasons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'referral_seasons' AND policyname = 'Referral seasons are public'
  ) THEN
    CREATE POLICY "Referral seasons are public"
      ON public.referral_seasons FOR SELECT USING (true);
  END IF;
END $$;

-- Season 1 opens at apply time and runs 3 months. Later seasons are inserted by
-- an admin (a follow-up season does NOT auto-create — awarding prizes needs a
-- deliberate season boundary, not a rolling one).
INSERT INTO public.referral_seasons (number, starts_at, ends_at)
VALUES (1, NOW(), NOW() + INTERVAL '3 months')
ON CONFLICT (number) DO NOTHING;

-- ── 3. referral_events ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('signup', 'course_completion')),
  course_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- signup rows carry no course; completion rows must name one.
  CONSTRAINT chk_referral_event_course CHECK ((kind = 'signup') = (course_id IS NULL)),
  CONSTRAINT chk_referral_event_no_self CHECK (referrer_id <> referred_id)
);

-- The two point rules as invariants (see header).
CREATE UNIQUE INDEX IF NOT EXISTS uq_referral_signup
  ON public.referral_events(referred_id) WHERE kind = 'signup';
CREATE UNIQUE INDEX IF NOT EXISTS uq_referral_course
  ON public.referral_events(referred_id, course_id) WHERE kind = 'course_completion';

-- Leaderboard aggregation path: points per referrer inside a season window.
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer_created
  ON public.referral_events(referrer_id, created_at);

ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'referral_events' AND policyname = 'Users read own referral events'
  ) THEN
    CREATE POLICY "Users read own referral events"
      ON public.referral_events FOR SELECT USING (auth.uid() = referrer_id);
  END IF;
END $$;

-- ── 4. Functions ────────────────────────────────────────────────────────────

-- Mint (or return) a learner's referral code. Lazy so the column stays NULL for
-- accounts that never open the referral surface. 8 hex chars = 4B values; the
-- loop retries the (astronomically unlikely) unique collision.
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code TEXT;
BEGIN
  SELECT referral_code INTO v_code FROM public.profiles WHERE id = p_user_id;
  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  LOOP
    v_code := substr(md5(gen_random_uuid()::text), 1, 8);
    BEGIN
      UPDATE public.profiles SET referral_code = v_code
      WHERE id = p_user_id AND referral_code IS NULL;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- collision: loop and mint another
    END;
  END LOOP;

  -- A concurrent minter may have won the NULL-guarded UPDATE race; return
  -- whatever the row actually holds.
  SELECT referral_code INTO v_code FROM public.profiles WHERE id = p_user_id;
  RETURN v_code;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_referral_code(UUID) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_referral_code(UUID) TO service_role;

-- Attach a captured referral code to a (new) account and mint the signup point.
-- Returns an outcome key the API maps to copy — never raises for a bad claim,
-- so the client flow can quietly drop a stale code.
CREATE OR REPLACE FUNCTION public.claim_referral(p_referred_id UUID, p_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_referrer_id UUID;
  v_referred_created TIMESTAMPTZ;
  v_existing UUID;
BEGIN
  SELECT referred_by, created_at INTO v_existing, v_referred_created
  FROM public.profiles WHERE id = p_referred_id;
  IF NOT FOUND THEN
    RETURN 'invalidAccount';
  END IF;
  IF v_existing IS NOT NULL THEN
    RETURN 'alreadyReferred';
  END IF;
  -- The claim window: a signup point is for NEW growth. 7 days covers a slow
  -- first session without letting existing accounts monetise a code swap.
  IF v_referred_created < NOW() - INTERVAL '7 days' THEN
    RETURN 'claimWindowClosed';
  END IF;

  SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = p_code;
  IF v_referrer_id IS NULL THEN
    RETURN 'invalidCode';
  END IF;
  IF v_referrer_id = p_referred_id THEN
    RETURN 'selfReferral';
  END IF;

  UPDATE public.profiles SET referred_by = v_referrer_id
  WHERE id = p_referred_id AND referred_by IS NULL;
  IF NOT FOUND THEN
    -- Concurrent claim won the write-once race.
    RETURN 'alreadyReferred';
  END IF;

  INSERT INTO public.referral_events (referrer_id, referred_id, kind)
  VALUES (v_referrer_id, p_referred_id, 'signup')
  ON CONFLICT (referred_id) WHERE kind = 'signup' DO NOTHING;

  RETURN 'claimed';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_referral(UUID, TEXT) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_referral(UUID, TEXT) TO service_role;

-- Mint the referrer's point for a referred learner's course completion. Called
-- from the course-finalized moment (lib/helius/event-handlers.ts). The partial
-- unique index makes a webhook replay, a resync, or a re-finalize a no-op.
-- Returns whether a point was actually minted.
CREATE OR REPLACE FUNCTION public.record_referral_course_completion(
  p_user_id UUID,
  p_course_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_referrer_id UUID;
  v_inserted UUID;
BEGIN
  IF p_course_id IS NULL OR p_course_id = '' THEN
    RETURN FALSE;
  END IF;

  SELECT referred_by INTO v_referrer_id FROM public.profiles WHERE id = p_user_id;
  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.referral_events (referrer_id, referred_id, kind, course_id)
  VALUES (v_referrer_id, p_user_id, 'course_completion', p_course_id)
  ON CONFLICT (referred_id, course_id) WHERE kind = 'course_completion' DO NOTHING
  RETURNING id INTO v_inserted;

  RETURN v_inserted IS NOT NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_referral_course_completion(UUID, TEXT) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_referral_course_completion(UUID, TEXT) TO service_role;

-- Season standings: points per referrer inside the season window. Public read,
-- mirroring get_leaderboard's shape and its is_public/username hygiene filters.
-- p_season NULL = the season covering NOW() (falling back to the latest season,
-- so the page still renders between seasons).
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(
  p_season INT DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  points BIGINT,
  rank BIGINT,
  season_number INT,
  season_starts_at TIMESTAMPTZ,
  season_ends_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_season public.referral_seasons%ROWTYPE;
BEGIN
  IF p_season IS NOT NULL THEN
    SELECT * INTO v_season FROM public.referral_seasons rs WHERE rs.number = p_season;
  ELSE
    SELECT * INTO v_season FROM public.referral_seasons rs
    WHERE NOW() >= rs.starts_at AND NOW() < rs.ends_at
    ORDER BY rs.number DESC LIMIT 1;
    IF NOT FOUND THEN
      SELECT * INTO v_season FROM public.referral_seasons rs
      ORDER BY rs.number DESC LIMIT 1;
    END IF;
  END IF;
  IF v_season.number IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      re.referrer_id AS user_id,
      p.username,
      p.avatar_url,
      COUNT(*)::BIGINT AS points,
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC, MIN(re.created_at) ASC)::BIGINT AS rank,
      v_season.number AS season_number,
      v_season.starts_at AS season_starts_at,
      v_season.ends_at AS season_ends_at
    FROM public.referral_events re
    JOIN public.profiles p ON p.id = re.referrer_id
    WHERE re.created_at >= v_season.starts_at
      AND re.created_at < v_season.ends_at
      AND p.is_public = true
      AND p.username IS NOT NULL
      AND p.username <> ''
    GROUP BY re.referrer_id, p.username, p.avatar_url
    ORDER BY COUNT(*) DESC, MIN(re.created_at) ASC
    LIMIT LEAST(p_limit, 100);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(INT, INT) TO authenticated, anon;
