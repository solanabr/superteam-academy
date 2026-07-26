-- ============================================================================
-- Migration: cohort leagues + you-±3 strip (LX-B9b, #574)
--
-- Replaces the "poisoned by design" global-absolute board (spec §3.2: XP is
-- farmable, so top ranks measure paste speed) with small weekly cohorts and a
-- nearby-rank view — the shape the leaderboard evidence actually supports
-- (Hanus & Fox: absolute-rank boards reduce motivation; Duolingo's ~30-person
-- weekly cohorts are the preferred SHAPE, magnitudes unverified).
--
-- DISPLAY-ONLY, NO REWARD CONTINGENCY (PED-10 / PED-14 / UIU-09). Leagues never
-- grant XP and rank never gates anything: score is DERIVED from XP the learner
-- already earned by learning. Rank-scarce / performance-contingent rewards are
-- forbidden (the d=−0.88 shape). A cohort is a social-comparison lens over
-- existing XP, not a new currency. This migration awards nothing and calls no
-- award_xp path — hence it can land AFTER the award_xp-touching migrations
-- (B8) without contending for that function (serialization order, spec §4).
--
-- ── D-4 (scheduler) IS UNDECIDED → LAZY on-first-read assignment ─────────────
-- The spec leaves D-4 open (lazy vs the platform's first cron). We implement the
-- LAZY path — the get_daily_quest_state precedent — so leagues need ZERO new
-- infrastructure: a learner is placed into a cohort the first time they read the
-- board in a given week (ensure_league_membership). Arrival-order cohorts,
-- engagement-matched by PRIOR-week league XP (approximates promotion/demotion
-- without a batch job). A cron upgrade to true batch matching is a clean
-- follow-up if D-4 later chooses it: it would only replace ensure_league_
-- membership's assignment body, not the tables, scoring, or read RPCs.
--
-- ── SNAPSHOT SCORING (do NOT extend the SUM-over-xp_transactions-per-call
--    pattern that get_leaderboard's windowed branch uses) ────────────────────
-- Each member row carries a materialized `score`. It is recomputed for the WHOLE
-- cohort in ONE grouped pass (refresh_cohort_scores), throttled to at most once
-- per LEAGUE_REFRESH_THROTTLE per cohort. The board / ±3 read RPCs therefore
-- read STORED scores — never a per-call SUM over xp_transactions — and every
-- member is refreshed together, so the ranking is a consistent, stable snapshot
-- within the throttle window (repeated reads return identical scores). This is
-- the "snapshot scores" the spec prescribes: bounded SUM cost, stable ordering.
--
-- ── LEAGUE-ELIGIBLE XP (anti-gaming + PED-14) ───────────────────────────────
-- Cohort score counts ONLY learning-source XP, filtered by xp_transactions.
-- source (LX-B9a) via is_league_eligible_source() — the server-written allowlist
-- the #574 review notes asked for, NOT free-text reason parsing. Excludes
-- creator_reward, community, and platform. `platform` is the deliberate
-- catch-all for surprise_bonus:* and arbitrary on-chain reward_xp memos (issue
-- #574 notes 1 & 2) — those must NEVER become competitive currency, so an
-- operator promo minted with a 'Completed lesson:'-shaped memo cannot leak in.
--
-- ── RLS / PRIVACY (spec §3 cross-check REQUIRED) ────────────────────────────
--   * user_xp stays own-row (untouched here). Cohort exposure is ONLY via the
--     SECURITY DEFINER read RPCs, mirroring get_leaderboard + public_profiles.
--   * The RPCs project ONLY public_profiles' non-sensitive columns (username,
--     avatar). is_public=false / deleted members are ANONYMIZED (username +
--     avatar NULL → "Anonymous learner" in the UI), never identity-leaked and
--     never silently dropped (a ~30-person cohort with holes breaks the
--     mechanic) — enforced by the LEFT JOIN.
--   * league_cohorts / league_members have NO broad public SELECT policy. Direct
--     table reads by anon fail; authenticated may read only its OWN membership
--     row (own-row SELECT, the user_daily_quests / review_items convention).
--   * league_tiers is public-read reference data (like review_schedule).
--
-- Idempotent (repo convention): CREATE TABLE/INDEX IF NOT EXISTS, ON CONFLICT
-- DO NOTHING seeds, CREATE OR REPLACE functions, DROP POLICY IF EXISTS before
-- CREATE POLICY. Safe to re-apply. Explicit BEGIN/COMMIT so the whole file is
-- one transaction even under a manual psql apply.
--
-- A tested ROLLBACK block is at the very bottom of this file.
-- Mirrored into supabase/schema.sql (the full-schema snapshot).
-- ============================================================================

BEGIN;

-- ── League-eligible source allowlist (server-written, issue #574) ───────────
-- Single source of truth for "counts toward cohort score". Mirrors the spirit
-- of xp_source_for_reason: a boolean predicate, not a free-text scan. INCLUDES
-- first-completion learning XP (lesson is on-chain-bitmap idempotent, quests /
-- course-completion / achievements are one-time); EXCLUDES creator_reward,
-- community, and platform (the surprise_bonus / arbitrary-memo catch-all).
CREATE OR REPLACE FUNCTION public.is_league_eligible_source(p_source TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_source IN ('lesson', 'course_completion', 'quest', 'achievement')
$$;

-- Not a client RPC — block PostgREST exposure (#377 convention). Called only
-- inside the SECURITY DEFINER league functions, which run as the owner.
REVOKE EXECUTE ON FUNCTION public.is_league_eligible_source(TEXT)
  FROM PUBLIC, anon, authenticated;

-- ── Week bucket (Monday-anchored ISO week) ──────────────────────────────────
-- The weekly reset boundary. date_trunc('week') anchors on Monday 00:00. A new
-- week => a new cohort => score naturally resets (score is scoped to the week).
CREATE OR REPLACE FUNCTION public.league_week_start(p_date DATE)
RETURNS DATE
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (date_trunc('week', p_date::timestamp))::date
$$;

REVOKE EXECUTE ON FUNCTION public.league_week_start(DATE)
  FROM PUBLIC, anon, authenticated;

-- ── league_tiers (reference data — engagement matching) ─────────────────────
-- tier -> minimum prior-week league XP to land in it. Assignment picks the
-- HIGHEST tier whose threshold the learner's prior-week XP clears, so cohorts
-- group similar-engagement learners and a learner's tier tracks recent activity
-- week over week (the lazy model's promotion/demotion). Encoded AS DATA (the
-- review_schedule / PED-04 convention) so thresholds re-tune with an UPDATE, not
-- a function edit. Tier 1 (threshold 0) is the floor: every learner qualifies.
-- Tier NAMES are localized in the UI (i18n), never stored here.
CREATE TABLE IF NOT EXISTS league_tiers (
  tier              SMALLINT PRIMARY KEY,
  min_prior_week_xp INTEGER  NOT NULL CHECK (min_prior_week_xp >= 0),
  UNIQUE (min_prior_week_xp)
);

ALTER TABLE league_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "League tiers are viewable by everyone" ON league_tiers;
CREATE POLICY "League tiers are viewable by everyone"
  ON league_tiers FOR SELECT USING (true);
-- No write policy: seeded here, mutated only by service_role / future DDL.

-- CONVENTION, NOT EVIDENCE: four engagement bands. Re-tune by editing rows.
INSERT INTO league_tiers (tier, min_prior_week_xp) VALUES
  (1, 0),
  (2, 100),
  (3, 500),
  (4, 2000)
ON CONFLICT (tier) DO NOTHING;

-- ── league_cohorts ──────────────────────────────────────────────────────────
-- One row per (week, tier, arrival-order fill). Multiple cohorts can share a
-- (week_start, tier) once one fills to capacity — hence NO unique on
-- (week_start, tier). member_count is maintained on assignment for the capacity
-- check; scores_refreshed_at throttles the snapshot recompute.
CREATE TABLE IF NOT EXISTS league_cohorts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start          DATE     NOT NULL,
  tier                SMALLINT NOT NULL REFERENCES league_tiers(tier),
  member_count        INTEGER  NOT NULL DEFAULT 0 CHECK (member_count >= 0),
  scores_refreshed_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assignment's hot path: newest open cohort for a (week, tier).
CREATE INDEX IF NOT EXISTS idx_league_cohorts_week_tier
  ON league_cohorts (week_start, tier, created_at DESC);

ALTER TABLE league_cohorts ENABLE ROW LEVEL SECURITY;
-- NO policy: cohorts are exposed only through the SECURITY DEFINER read RPCs.
-- Direct reads by anon/authenticated fail (spec accept criterion).

-- ── league_members ──────────────────────────────────────────────────────────
-- UNIQUE(user_id, week_start): one membership per learner per week — the
-- idempotency guard the whole lazy-assignment race-safety rests on. `score` is
-- the materialized weekly league XP (snapshot), refreshed by
-- refresh_cohort_scores. joined_at is the stable rank tiebreaker.
CREATE TABLE IF NOT EXISTS league_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id  UUID NOT NULL REFERENCES league_cohorts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  score      BIGINT NOT NULL DEFAULT 0 CHECK (score >= 0),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

-- Board / ±3 read the members of one cohort, ordered by score.
CREATE INDEX IF NOT EXISTS idx_league_members_cohort_score
  ON league_members (cohort_id, score DESC);

ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- Own-row SELECT only (user_daily_quests / review_items convention): a learner
-- may read their OWN membership row client-side. Cross-user cohort exposure is
-- ONLY via the RPCs — a learner cannot read other members directly.
DROP POLICY IF EXISTS "Users can view their own league membership" ON league_members;
CREATE POLICY "Users can view their own league membership"
  ON league_members FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policy: writes go through the SECURITY DEFINER RPCs.

-- ── ensure_league_membership (LAZY assignment) ──────────────────────────────
-- Idempotent per (user, week): places the learner into a cohort on first read
-- of the week and returns the cohort id. Tier = highest league_tiers band their
-- PRIOR-week league XP clears (engagement matching). Fill = newest open cohort
-- for (week, tier), else a fresh one. Race safety: UNIQUE(user_id, week_start)
-- is the backstop — a lost insert re-reads the winner's cohort and does NOT
-- double-count member_count; a chosen cohort is row-locked (SKIP LOCKED) so
-- concurrent assigners never overfill it (they fall through to a new cohort).
-- Capacity is a SOFT cap by construction; ~30 is the Duolingo shape (spec).
CREATE OR REPLACE FUNCTION public.ensure_league_membership(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- ~30-person weekly cohorts (Duolingo shape, spec LX-B9b). Soft cap.
  LEAGUE_COHORT_CAPACITY CONSTANT INTEGER := 30;
  v_week_start      DATE;
  v_prior_start     DATE;
  v_prior_xp        BIGINT;
  v_tier            SMALLINT;
  v_cohort_id       UUID;
  v_inserted_cohort UUID;
BEGIN
  v_week_start  := public.league_week_start(CURRENT_DATE);

  -- Fast path: already placed this week.
  SELECT cohort_id INTO v_cohort_id
  FROM public.league_members
  WHERE user_id = p_user_id AND week_start = v_week_start;
  IF FOUND THEN
    RETURN v_cohort_id;
  END IF;

  -- Engagement matching: prior-week league XP -> tier band.
  v_prior_start := v_week_start - 7;
  SELECT COALESCE(SUM(x.amount), 0) INTO v_prior_xp
  FROM public.xp_transactions x
  WHERE x.user_id = p_user_id
    AND x.created_at >= v_prior_start::timestamptz
    AND x.created_at <  v_week_start::timestamptz
    AND public.is_league_eligible_source(x.source);

  SELECT t.tier INTO v_tier
  FROM public.league_tiers t
  WHERE t.min_prior_week_xp <= v_prior_xp
  ORDER BY t.min_prior_week_xp DESC
  LIMIT 1;
  -- Floor guard (tier 1 has threshold 0, so this is defensive only).
  IF v_tier IS NULL THEN
    SELECT MIN(t.tier) INTO v_tier FROM public.league_tiers t;
  END IF;

  -- Newest open cohort for (week, tier); lock it so a concurrent assigner
  -- either shares it (serialized under the lock) or SKIPs to a fresh cohort
  -- rather than overfilling this one.
  SELECT c.id INTO v_cohort_id
  FROM public.league_cohorts c
  WHERE c.week_start = v_week_start
    AND c.tier = v_tier
    AND c.member_count < LEAGUE_COHORT_CAPACITY
  ORDER BY c.created_at DESC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_cohort_id IS NULL THEN
    INSERT INTO public.league_cohorts (week_start, tier, member_count)
    VALUES (v_week_start, v_tier, 0)
    RETURNING id INTO v_cohort_id;
  END IF;

  -- Insert the membership. On a lost race the UNIQUE(user_id, week_start) guard
  -- yields 0 rows; only a genuine insert increments member_count.
  INSERT INTO public.league_members (cohort_id, user_id, week_start, score)
  VALUES (v_cohort_id, p_user_id, v_week_start, 0)
  ON CONFLICT (user_id, week_start) DO NOTHING
  RETURNING cohort_id INTO v_inserted_cohort;

  IF v_inserted_cohort IS NOT NULL THEN
    UPDATE public.league_cohorts
    SET member_count = member_count + 1
    WHERE id = v_cohort_id;
    RETURN v_cohort_id;
  END IF;

  -- Lost the race: return the winner's cohort (member_count already counted it).
  -- Any empty cohort this call may have created is harmless — the next assigner
  -- fills it (member_count = 0 < capacity).
  SELECT cohort_id INTO v_cohort_id
  FROM public.league_members
  WHERE user_id = p_user_id AND week_start = v_week_start;
  RETURN v_cohort_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_league_membership(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_league_membership(UUID) TO service_role;

-- ── refresh_cohort_scores (throttled snapshot recompute) ────────────────────
-- Recomputes score for EVERY member of one cohort in a single grouped pass over
-- league-eligible xp_transactions in the cohort's week — but at most once per
-- LEAGUE_REFRESH_THROTTLE (row-locked + re-checked so concurrent reads collapse
-- to one recompute). Between refreshes the board is a stable snapshot. This is
-- the ONLY place league scores SUM xp_transactions — the read RPCs never do.
CREATE OR REPLACE FUNCTION public.refresh_cohort_scores(p_cohort_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- Snapshot freshness window. Short enough that newly-earned XP surfaces within
  -- ~a minute; long enough that a burst of reads triggers ONE recompute.
  LEAGUE_REFRESH_THROTTLE CONSTANT INTERVAL := INTERVAL '1 minute';
  v_week_start DATE;
  v_refreshed  TIMESTAMPTZ;
BEGIN
  SELECT week_start, scores_refreshed_at INTO v_week_start, v_refreshed
  FROM public.league_cohorts
  WHERE id = p_cohort_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Fresh snapshot within the throttle window: keep it stable, do nothing.
  IF v_refreshed IS NOT NULL
     AND v_refreshed > now() - LEAGUE_REFRESH_THROTTLE THEN
    RETURN;
  END IF;

  UPDATE public.league_members m
  SET score = COALESCE((
    SELECT SUM(x.amount)
    FROM public.xp_transactions x
    WHERE x.user_id = m.user_id
      AND x.created_at >= v_week_start::timestamptz
      AND x.created_at <  (v_week_start + 7)::timestamptz
      AND public.is_league_eligible_source(x.source)
  ), 0)
  WHERE m.cohort_id = p_cohort_id;

  UPDATE public.league_cohorts
  SET scores_refreshed_at = now()
  WHERE id = p_cohort_id;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_cohort_scores(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_cohort_scores(UUID) TO service_role;

-- ── get_cohort_leaderboard (full cohort board) ──────────────────────────────
-- Assigns (lazy) + refreshes the snapshot, then returns the whole cohort ranked
-- by stored score. Identity comes from public_profiles via LEFT JOIN: private /
-- deleted members return NULL username+avatar (anonymized, NEVER dropped).
-- is_you flags the caller so the UI labels their row even when anonymized. tier
-- and week_start are denormalized onto each row for the league header.
CREATE OR REPLACE FUNCTION public.get_cohort_leaderboard(p_user_id UUID)
RETURNS TABLE (
  user_id    UUID,
  username   TEXT,
  avatar_url TEXT,
  score      BIGINT,
  rank       BIGINT,
  is_you     BOOLEAN,
  tier       SMALLINT,
  week_start DATE
)
-- VOLATILE (default): assigns membership + refreshes the snapshot on read, so
-- it is NOT STABLE despite being a "read" endpoint (get_daily_quest_state does
-- the same — lazy read-through with writes).
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cohort_id UUID;
BEGIN
  v_cohort_id := public.ensure_league_membership(p_user_id);
  PERFORM public.refresh_cohort_scores(v_cohort_id);

  RETURN QUERY
  SELECT
    m.user_id,
    pp.username,
    pp.avatar_url,
    m.score,
    ROW_NUMBER() OVER (ORDER BY m.score DESC, m.joined_at ASC, m.user_id)::BIGINT,
    (m.user_id = p_user_id),
    c.tier,
    c.week_start
  FROM public.league_members m
  JOIN public.league_cohorts c ON c.id = m.cohort_id
  LEFT JOIN public.public_profiles pp ON pp.id = m.user_id
  WHERE m.cohort_id = v_cohort_id
  ORDER BY m.score DESC, m.joined_at ASC, m.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_cohort_leaderboard(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cohort_leaderboard(UUID) TO service_role;

-- The "you ±3" nearby-rank window is derived in the API layer (cohortStripWindow)
-- over THIS board's snapshot rows — a single ranked read, never a second per-call
-- SUM — so the window stays pure/unit-testable at the edges and there is no
-- SQL⇄TS duplication of the sliding-window arithmetic. A cohort is capped at ~30
-- rows, so slicing the ±3 in the route is negligible.

COMMIT;

-- ============================================================================
-- ROLLBACK (tested) — restores the exact pre-migration state (no league spine).
-- Everything this migration created is new, so the rollback unconditionally
-- drops exactly those objects. league_members / league_cohorts drop their
-- indexes + policies with them; drop members before cohorts (FK), cohorts before
-- tiers (FK). Run as one transaction:
-- ----------------------------------------------------------------------------
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.get_cohort_leaderboard(UUID);
-- DROP FUNCTION IF EXISTS public.refresh_cohort_scores(UUID);
-- DROP FUNCTION IF EXISTS public.ensure_league_membership(UUID);
-- DROP TABLE IF EXISTS public.league_members;
-- DROP TABLE IF EXISTS public.league_cohorts;
-- DROP TABLE IF EXISTS public.league_tiers;
-- DROP FUNCTION IF EXISTS public.league_week_start(DATE);
-- DROP FUNCTION IF EXISTS public.is_league_eligible_source(TEXT);
-- COMMIT;
-- ============================================================================
