-- ============================================
-- Superteam LMS — Database schema snapshot (GENERATED)
-- Do NOT edit by hand and do NOT run this directly to make changes.
-- Source of truth is supabase/migrations/. Regenerate with:
--   supabase db dump --local -f supabase/schema.sql
-- ============================================

-- ─────────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  google_id TEXT UNIQUE,
  github_id TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',
  -- Learner-owned UI preferences (LX-A6, #582). First consumer: the session-end
  -- if-then plan { "nextLesson": { "days": ["tue","thu"], "time": "19:00" } } —
  -- a LIST of weekdays, up to all seven (= daily). The original single-`day`
  -- string was converted to a one-element `days` array by
  -- 20260804120000_recurring_lesson_plan.sql and is no longer read. Non-PII,
  -- not in public_profiles; written self-service via the own-row profiles UPDATE
  -- RLS policy. prefs itself is not privilege-bearing (unlike wallet_address,
  -- deleted_at, and the referral columns, each of which carries a write-lock
  -- trigger), so the shape+size CHECKs below (chk_profiles_prefs_object /
  -- chk_profiles_prefs_size) are the sole bound on this self-write. See
  -- 20260726160000_add_profiles_prefs.sql.
  prefs JSONB NOT NULL DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  name_rerolls_used INTEGER DEFAULT 0,
  wallet_xp_synced_at TIMESTAMPTZ,
  -- NOTE: profiles.role was RETIRED by SP1 (migration 20260710120000, applied to
  -- prod as ledger 20260711152518). The column, its chk_profiles_role CHECK, and
  -- the enforce_profile_role_write lockdown trigger are all gone from prod, so
  -- they are absent from this snapshot too (#699). Authorization no longer lives
  -- on a profiles column, but several columns are still privilege-bearing and
  -- carry write-lock triggers rather than CHECKs: wallet_address (#408),
  -- deleted_at (#1103), and the referral pair.
  -- /start intake state (LX-A3, #566). Self-writable via the own-row UPDATE
  -- policy: non-sensitive columns bounded only by the CHECKs below. NULL until a
  -- learner runs the intake. See migration 20260726150000_add_profiles_segment_state.sql.
  segment SMALLINT,
  goal TEXT,
  daily_goal SMALLINT,
  -- Account-deletion tombstone (20260704140000_account_deletion.sql). We never
  -- hard-delete a profile: on-chain XP and credential NFTs are immutable and
  -- bound to the wallet, and DB history references them. POST /api/account/delete
  -- stamps both and scrubs the PII instead. deleted_at is what every public read
  -- and every login chokepoint keys on, so it is PRIVILEGE-BEARING and locked to
  -- service_role by trg_enforce_profile_deleted_at_write below (#1103);
  -- deletion_requested_at is the audit trail and is not gated.
  deleted_at TIMESTAMPTZ,
  deletion_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  tx_signature TEXT,
  wallet_address TEXT,
  UNIQUE(user_id, course_id)
);

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  tx_signature TEXT,
  lesson_index SMALLINT,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  -- Streak-freeze inventory (LX-B8, #573). A missed day is consumed from here
  -- instead of resetting the streak. Capped at 2 by chk_..._streak_freezes_bounds;
  -- earned server-side via the login_streak quest reward, never client-minted.
  streak_freezes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  tx_signature TEXT,
  idempotency_key TEXT,
  -- Typed award source (LX-B9a, #557) — league scoring filters by this instead
  -- of parsing free-text reasons. Derived from the reason prefix inside
  -- award_xp via xp_source_for_reason(); hardcoded 'community' inside
  -- award_community_xp. CHECK constraint below (chk_xp_transactions_source).
  source TEXT NOT NULL
);

-- Consumed-freeze log (LX-B8, #573): one row per day a streak freeze saved.
-- Drives the retroactive calendar snowflake AND makes freeze consumption
-- idempotent per calendar day across the three concurrent streak writers.
-- Writes only via the SECURITY DEFINER streak helpers; own-row SELECT for the
-- client calendar (RLS policy below).
CREATE TABLE streak_freezes_used (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  frozen_date DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, frozen_date)
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  tx_signature TEXT,
  asset_address TEXT,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  course_title TEXT NOT NULL,
  mint_address TEXT,
  metadata_uri TEXT,
  minted_at TIMESTAMPTZ DEFAULT NOW(),
  tx_signature TEXT,
  credential_type TEXT DEFAULT 'legacy',
  UNIQUE(user_id, course_id)
);

-- Stores full Metaplex metadata JSON so the on-chain URI stays under 200 bytes.
-- Served by GET /api/certificates/metadata?id=<uuid>.
CREATE TABLE nft_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SIWS Nonce Replay Protection
-- ============================================
CREATE TABLE IF NOT EXISTS siws_nonces (
  nonce TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'consumed')),
  wallet_address TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at TIMESTAMPTZ
);

CREATE INDEX idx_siws_nonces_created_at ON siws_nonces (created_at);
CREATE INDEX idx_siws_nonces_status ON siws_nonces (status);

ALTER TABLE siws_nonces ENABLE ROW LEVEL SECURITY;

-- No public access — only service_role can read/write
CREATE POLICY "Service role only" ON siws_nonces
  FOR ALL USING (false);

-- ============================================
-- Data Integrity CHECK Constraints
-- ============================================
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_username_length CHECK (char_length(username) BETWEEN 1 AND 30);
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_name_rerolls_non_negative CHECK (name_rerolls_used >= 0);
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_name_rerolls_max CHECK (name_rerolls_used <= 3);
-- (chk_profiles_role removed with the retired role column — see #699.)
-- /start intake bounds (LX-A3, #566). NULL passes each CHECK (never-onboarded rows).
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_segment CHECK (segment IN (1, 2, 3));
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_goal CHECK (goal IN ('job', 'build', 'explore'));
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_daily_goal CHECK (daily_goal BETWEEN 1 AND 20);
-- Bound the self-writable prefs JSONB on both shape and size (LX-A6, #582): a
-- JSON object of at most 2 KB. This is the sole bound on the self-write — no
-- profiles column is privilege-bearing. See 20260726160000_add_profiles_prefs.sql.
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_prefs_object CHECK (jsonb_typeof(prefs) = 'object');
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_prefs_size CHECK (pg_column_size(prefs) <= 2048);

ALTER TABLE user_xp
  ADD CONSTRAINT chk_user_xp_total_xp_non_negative CHECK (total_xp >= 0);
ALTER TABLE user_xp
  ADD CONSTRAINT chk_user_xp_level_non_negative CHECK (level >= 0);
ALTER TABLE user_xp
  ADD CONSTRAINT chk_user_xp_current_streak_non_negative CHECK (current_streak >= 0);
ALTER TABLE user_xp
  ADD CONSTRAINT chk_user_xp_longest_streak_non_negative CHECK (longest_streak >= 0);
ALTER TABLE user_xp
  ADD CONSTRAINT chk_user_xp_longest_gte_current CHECK (longest_streak >= current_streak);
ALTER TABLE user_xp
  ADD CONSTRAINT chk_user_xp_streak_freezes_bounds CHECK (streak_freezes BETWEEN 0 AND 2);

ALTER TABLE xp_transactions
  ADD CONSTRAINT chk_xp_transactions_amount_positive CHECK (amount > 0);
ALTER TABLE xp_transactions
  ADD CONSTRAINT chk_xp_transactions_source CHECK (source IN (
    'lesson',
    'course_completion',
    'achievement',
    'quest',
    'creator_reward',
    'community',
    'platform'
  ));

-- A course can only be completed at or after it was enrolled. Closes the
-- forged sub-24h enrolled->completed window that fakes Speed Runner. NULL
-- completed_at (not yet finished) passes. No FK on course_id: courses live in
-- Sanity, not Postgres.
ALTER TABLE enrollments
  ADD CONSTRAINT chk_enrollments_completed_after_enrolled
  CHECK (completed_at IS NULL OR completed_at >= enrolled_at);

-- A completion timestamp may only exist on a completed row. Legit writers
-- (Helius webhook + admin resync) always set completed = true alongside
-- completed_at, so this rejects no valid row.
ALTER TABLE user_progress
  ADD CONSTRAINT chk_user_progress_completed_at_requires_completed
  CHECK (completed_at IS NULL OR completed = true);

-- ─────────────────────────────────────────────
-- 2. INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created_at ON xp_transactions(created_at);
CREATE UNIQUE INDEX idx_xp_transactions_idempotency
  ON xp_transactions (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
-- Per-course certificate counts (teacher overview, #285) filter by course_id.
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
-- One mint tx == one certificate row. Partial so NULL-signature rows
-- (off-chain / resync) stay allowed while real mint signatures can't collide.
CREATE UNIQUE INDEX idx_certificates_tx_signature_unique
  ON certificates (tx_signature) WHERE tx_signature IS NOT NULL;
CREATE INDEX idx_user_xp_total_xp ON user_xp(total_xp DESC);

-- ─────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_freezes_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_metadata ENABLE ROW LEVEL SECURITY;

-- is_public_profile (#493): SECURITY DEFINER boolean predicate — "is this user a
-- public, non-deleted profile?" — evaluated as the function owner so it bypasses
-- RLS on profiles. The sibling public-read policies on enrollments,
-- user_progress, user_achievements and certificates use it INSTEAD of an inline
-- `EXISTS (SELECT 1 FROM profiles ...)`, whose subquery would otherwise run under
-- the caller's RLS on profiles. Since profiles has no public-profile row policy
-- anymore (the google_id/github_id deanonymization fix), that inline subquery
-- would see only the caller's own row and break every cross-user read of those
-- tables. Returning a bare boolean leaks no row or column.
CREATE OR REPLACE FUNCTION public.is_public_profile(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND is_public = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_public_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_profile(uuid) TO anon, authenticated;

-- profiles
-- No public-profile row policy (#493): a logged-in user could otherwise read
-- google_id/github_id (OAuth subject IDs) of any is_public profile via the wide
-- `authenticated` column grant, deanonymizing a public wallet -> real identity.
-- authenticated/anon reach only their OWN row (own-row SELECT below / anon none);
-- cross-user profile identity is served solely by the public_profiles view.

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Column-restrict the anon SELECT (#486). The "public profiles" policy above
-- grants ROW visibility of public rows, and Supabase's default grant gives anon
-- whole-table SELECT (every column) — so anon could read google_id/github_id
-- (OAuth subject IDs) of any public profile. RLS gates rows, not columns; and a
-- column-level REVOKE cannot carve a subset out of a table-level grant, so drop
-- the table SELECT and re-grant only the non-sensitive columns. Withholds
-- google_id, github_id, deleted_at, deletion_requested_at from anon.
-- (authenticated keeps whole-table SELECT — it needs own-row google_id for
-- settings; the authenticated-reads-others-public-rows residual is tracked as a
-- view-routing follow-up.)
REVOKE SELECT ON profiles FROM anon;
GRANT SELECT (
  id, wallet_address, username, bio, avatar_url, social_links,
  is_public, name_rerolls_used, wallet_xp_synced_at, created_at
) ON profiles TO anon;

-- enrollments
CREATE POLICY "Users can view their own enrollments"
  ON enrollments FOR SELECT USING (auth.uid() = user_id);

-- No authenticated INSERT/DELETE/UPDATE: enrollment rows are written only by
-- service_role (the Helius enroll/unenroll/finalize webhook in
-- lib/helius/event-handlers.ts, its retry queue in lib/solana/onchain-queue.ts,
-- and the admin resync route). The client only submits the on-chain tx and lets
-- the webhook sync the row. A direct client INSERT/DELETE would let a user
-- delete + re-insert their own enrollment to forge a fresh enrolled_at, faking a
-- sub-24h enrolled->completed window and minting the Speed Runner achievement.
-- SELECT policies (own + public-profile) are intentionally left in place.

CREATE POLICY "Public profile enrollments are viewable"
  ON enrollments FOR SELECT USING (public.is_public_profile(user_id));

-- user_progress
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public profile progress is viewable"
  ON user_progress FOR SELECT USING (public.is_public_profile(user_id));

-- No authenticated INSERT/UPDATE: progress is written only by service_role
-- (Helius webhook + admin resync). Direct client writes would let users forge
-- completed=true rows and mint on-chain XP via the daily-quest path.

-- user_xp (SELECT own only — public total_xp/level served via public_user_xp view;
-- leaderboard served via get_leaderboard(); mutations via SECURITY DEFINER functions)
CREATE POLICY "Users can view their own XP"
  ON user_xp FOR SELECT USING (auth.uid() = user_id);

-- streak_freezes_used (SELECT own only — the client calendar renders the
-- learner's own snowflakes; writes only via the SECURITY DEFINER streak helpers.
-- No INSERT/UPDATE/DELETE policy: a client write path would let a learner forge
-- frozen days.)
CREATE POLICY "Users can view their own frozen days"
  ON streak_freezes_used FOR SELECT USING (auth.uid() = user_id);

-- xp_transactions (SELECT own only — raw rows never exposed to anon; aggregates
-- served via get_leaderboard()/community_stats; inserts via award_xp function)
CREATE POLICY "Users can view their own XP transactions"
  ON xp_transactions FOR SELECT USING (auth.uid() = user_id);

-- user_achievements (SELECT only — inserts via unlock_achievement function)
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public achievements are viewable on public profiles"
  ON user_achievements FOR SELECT USING (public.is_public_profile(user_id));

-- certificates
CREATE POLICY "Users can view their own certificates"
  ON certificates FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public certificates are viewable by everyone"
  ON certificates FOR SELECT USING (public.is_public_profile(user_id));

-- NOTE: No INSERT or UPDATE policies on certificates.
-- All certificate writes go through service_role via the API routes.
-- Allowing authenticated users to self-issue certificates would let them
-- fabricate completion records for courses they have not finished.

-- nft_metadata (public read only — writes via service_role API routes)
CREATE POLICY "Anyone can read nft metadata"
  ON nft_metadata FOR SELECT USING (true);

-- NOTE: No INSERT policy on nft_metadata for authenticated users.
-- All metadata rows are inserted by the lesson-complete API route using
-- the service_role key. An open authenticated INSERT policy would allow
-- any logged-in user to flood the table or plant fake metadata.

-- ─────────────────────────────────────────────
-- 4. SECURE SERVER-SIDE FUNCTIONS
-- ─────────────────────────────────────────────

-- Reason→source derivation for xp_transactions.source (LX-B9a, #557).
-- DEMOTED by #736 to a DEFAULT/BACKFILL helper: award_xp now takes an explicit
-- p_source and only falls back to this derivation when the caller passes NULL.
-- Still the single mapping shared by that fallback AND the old-row backfill in
-- 20260726120000_add_xp_transactions_source.sql, so derived rows never disagree.
-- Kept because reason prefixes remain load-bearing elsewhere: award_xp's daily
-- cap counts
-- `NOT LIKE 'community:%'`, award_community_xp's cap counts
-- `LIKE 'community:%'`, and durable pending_onchain_actions payloads carry
-- reasons that may be swept long after deploy. Each prefix below is verified
-- against its writer; unknown reasons (on-chain reward_xp memos are arbitrary
-- authority-supplied text) fall to 'platform'. No 'challenge'/'streak' values:
-- no writer exists for either (challenges complete as lessons on-chain).
CREATE OR REPLACE FUNCTION public.xp_source_for_reason(p_reason TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_reason LIKE 'community:%'              THEN 'community'
    WHEN p_reason LIKE 'daily_quest:%'            THEN 'quest'
    WHEN p_reason LIKE 'Completed lesson:%'       THEN 'lesson'
    WHEN p_reason LIKE 'Course completion bonus:%' THEN 'course_completion'
    WHEN p_reason LIKE 'Completed course:%'       THEN 'course_completion'
    WHEN p_reason LIKE 'Creator reward:%'         THEN 'creator_reward'
    WHEN p_reason LIKE 'Achievement reward:%'     THEN 'achievement'
    ELSE 'platform'
  END
$$;

-- Not a client RPC — block PostgREST exposure (#377 convention). No
-- service_role grant needed: only called from inside the SECURITY DEFINER
-- award functions, which execute as the function owner.
REVOKE EXECUTE ON FUNCTION public.xp_source_for_reason(TEXT) FROM PUBLIC, anon, authenticated;

-- ── Streak forgiveness helpers (LX-B8, #573) ────────────────────────────────
-- Shared by all three streak writers so they agree by construction. See
-- migration 20260726190000_streak_forgiveness.sql for the full design rationale.

-- Covers every day in [p_from_date, p_to_date] not already frozen. Returns TRUE
-- iff the whole gap is covered (streak survives). Consumes exactly the number of
-- not-already-frozen days in one guarded UPDATE (atomic, never over-consumes,
-- never negative), and logs each covered day for the calendar snowflake.
CREATE OR REPLACE FUNCTION cover_missed_days_with_freezes(
  p_user_id   UUID,
  p_from_date DATE,
  p_to_date   DATE
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_needed INTEGER;
  v_d      DATE;
BEGIN
  IF p_to_date < p_from_date THEN
    RETURN TRUE;
  END IF;

  -- Serialize the freeze decision across all three streak writers (they hold
  -- different per-writer advisory locks, so without this a concurrent pair races
  -- on the unlocked count below and the loser spuriously resets while burning
  -- the freeze). Taken BEFORE the count: the loser runs after the winner
  -- committed, sees the day already logged (v_needed = 0), and survives.
  PERFORM pg_advisory_xact_lock(hashtext('streak:' || p_user_id::text)::bigint);

  SELECT COUNT(*) INTO v_needed
  FROM generate_series(p_from_date, p_to_date, INTERVAL '1 day') AS g(d)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.streak_freezes_used sfu
    WHERE sfu.user_id = p_user_id AND sfu.frozen_date = g.d::date
  );

  IF v_needed = 0 THEN
    RETURN TRUE;
  END IF;

  UPDATE public.user_xp
  SET streak_freezes = streak_freezes - v_needed
  WHERE user_id = p_user_id AND streak_freezes >= v_needed;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  FOR v_d IN
    SELECT g.d::date FROM generate_series(p_from_date, p_to_date, INTERVAL '1 day') AS g(d)
  LOOP
    INSERT INTO public.streak_freezes_used (user_id, frozen_date)
    VALUES (p_user_id, v_d)
    ON CONFLICT (user_id, frozen_date) DO NOTHING;
  END LOOP;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION cover_missed_days_with_freezes(UUID, DATE, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION cover_missed_days_with_freezes(UUID, DATE, DATE) TO service_role;

-- The shared headline-streak decision (award_xp + award_community_xp):
--   no prior activity → 1 · active today → keep · active yesterday → +1 ·
--   gap > 1 day → +1 if freezes cover it, else 1 (reset).
CREATE OR REPLACE FUNCTION next_streak_value(
  p_user_id        UUID,
  p_last_activity  DATE,
  p_current_streak INTEGER,
  p_today          DATE
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
-- Non-gap branches are byte-faithful to award_xp's prior inline logic; only the
-- ELSE (gap > 1 day) forgives via freezes instead of an unconditional reset.
-- `= p_today` (not `>=`) preserves the base reset-on-future-date behavior.
BEGIN
  IF p_last_activity IS NULL THEN
    RETURN 1;
  ELSIF p_last_activity = p_today THEN
    RETURN COALESCE(p_current_streak, 1);
  ELSIF p_last_activity = p_today - 1 THEN
    RETURN COALESCE(p_current_streak, 0) + 1;
  ELSIF public.cover_missed_days_with_freezes(
          p_user_id, p_last_activity + 1, p_today - 1) THEN
    RETURN COALESCE(p_current_streak, 0) + 1;
  ELSE
    RETURN 1;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION next_streak_value(UUID, DATE, INTEGER, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION next_streak_value(UUID, DATE, INTEGER, DATE) TO service_role;

-- Grant a freeze (quest reward, capped at 2). Upserts user_xp so a learner with
-- no XP yet still banks it; auto-applied server-side on login_streak completion.
CREATE OR REPLACE FUNCTION grant_streak_freeze(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.user_xp (user_id, streak_freezes)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    streak_freezes = LEAST(user_xp.streak_freezes + 1, 2)
  RETURNING streak_freezes INTO v_count;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION grant_streak_freeze(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION grant_streak_freeze(UUID) TO service_role;

-- Award XP (called from API routes with service_role key only)
-- Also handles streak tracking: increments current_streak if last activity was
-- yesterday, applies a streak freeze (or resets to 1) if gap > 1 day, and
-- updates longest_streak. Streak decision delegated to next_streak_value.
-- p_idempotency_key: when provided, uses ON CONFLICT DO NOTHING to prevent
-- double-award from concurrent retries (race-safe deduplication).
--
-- SECURITY (P0-C4) — interim XP-integrity caps. Challenge "passed" is currently
-- browser-trusted, so a forged completion could otherwise mint XP for unsolved
-- work. These server-side caps bound the blast radius regardless of what the
-- client (or a misconfigured on-chain xp_per_lesson) claims:
--   * MAX_AWARD_XP       — hard ceiling on any single award (clamped, not rejected).
--   * MAX_DAILY_AWARD_XP — per-user/day ceiling across the learning XP path
--     (community XP is excluded — it has its own 50/day cap in award_community_xp).
-- Clamping (vs. rejecting) keeps legitimate large one-time awards — e.g. course
-- completion bonuses up to 2000 — working while capping farmable repetition.
-- NOTE: this is defense-in-depth, NOT a substitute for true server-side
-- challenge validation (tracked as a follow-up).
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT DEFAULT NULL,
  p_tx_signature TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL
) RETURNS INTEGER
-- Returns the amount actually credited (after per-award + daily-cap clamps).
--   > 0 → XP landed (or, for an idempotency-key duplicate, had already landed —
--         the previously-credited amount is returned so callers can treat
--         "already delivered" as delivered).
--   = 0 → nothing was credited (invalid amount, or the daily cap consumed the
--         whole award). Queue-style callers MUST NOT mark delivery resolved
--         on 0 — the credit was dropped, not delivered.
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
  v_new_longest INTEGER;
  v_daily_total INTEGER;
  v_prev_amount INTEGER;
  -- Typed source (LX-B9a / #736). POSITIVE by default: the caller states it via
  -- p_source. Falls back to the reason-prefix derivation (xp_source_for_reason)
  -- only when the caller passes NULL, so un-migrated callers are unaffected and
  -- old-row backfill still shares one mapping.
  v_source TEXT;
  -- Hard per-award ceiling. Matches the documented "max 2000 XP per award"
  -- (the largest legitimate single award is a course-completion bonus).
  c_max_award_xp CONSTANT INTEGER := 2000;
  -- Per-user daily ceiling across the learning XP path (lessons, challenges,
  -- bonuses, achievements). Generous enough for normal multi-course days,
  -- low enough to cap a forged-"passed" farming loop.
  c_max_daily_award_xp CONSTANT INTEGER := 5000;
BEGIN
  -- Reject non-positive awards outright (defensive — callers pass positives).
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN 0;
  END IF;

  -- Clamp any single award to the hard ceiling.
  IF p_amount > c_max_award_xp THEN
    p_amount := c_max_award_xp;
  END IF;

  -- Serialize concurrent awards for the same user so the read-then-insert daily
  -- cap below is atomic: without this lock, two parallel awards can both read a
  -- sub-cap total and both insert, blowing past the daily ceiling.
  PERFORM pg_advisory_xact_lock(hashtext('award_xp:' || p_user_id::text)::bigint);

  -- Enforce the per-user daily ceiling. Sum today's learning-path awards
  -- (excluding community XP, which is capped separately) and clamp the credit
  -- so the daily total can never exceed the ceiling. The window boundary is
  -- pinned to UTC midnight so it is independent of the DB session timezone.
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.xp_transactions
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
    AND reason NOT LIKE 'community:%';

  IF v_daily_total >= c_max_daily_award_xp THEN
    RETURN 0;
  END IF;

  IF v_daily_total + p_amount > c_max_daily_award_xp THEN
    p_amount := c_max_daily_award_xp - v_daily_total;
  END IF;

  IF p_amount <= 0 THEN
    RETURN 0;
  END IF;

  -- Positive source wins; derivation is the fallback for NULL (#736).
  v_source := COALESCE(p_source, public.xp_source_for_reason(p_reason));

  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.xp_transactions (user_id, amount, reason, source, idempotency_key, tx_signature)
    VALUES (p_user_id, p_amount, p_reason, v_source, p_idempotency_key, p_tx_signature)
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

    -- If nothing was inserted (duplicate), skip the XP update too. Report the
    -- previously-credited amount (always > 0 — award_xp never records a
    -- non-positive transaction) so callers see "already delivered", not
    -- "dropped".
    IF NOT FOUND THEN
      SELECT amount INTO v_prev_amount
      FROM public.xp_transactions
      WHERE user_id = p_user_id
        AND idempotency_key = p_idempotency_key;
      RETURN COALESCE(v_prev_amount, 0);
    END IF;
  ELSE
    INSERT INTO public.xp_transactions (user_id, amount, reason, source, tx_signature)
    VALUES (p_user_id, p_amount, p_reason, v_source, p_tx_signature);
  END IF;

  -- Get current streak state, then apply the shared forgiveness-aware decision.
  -- next_streak_value consumes freezes (and logs frozen days) on a forgiven gap
  -- BEFORE the upsert below writes the surviving streak — same row, one txn.
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.user_xp
  WHERE user_id = p_user_id;

  v_new_streak := public.next_streak_value(p_user_id, v_last_activity, v_current_streak, CURRENT_DATE);
  v_new_longest := GREATEST(COALESCE(v_longest_streak, 0), v_new_streak);

  INSERT INTO public.user_xp (user_id, total_xp, level, last_activity_date, current_streak, longest_streak)
  VALUES (
    p_user_id,
    p_amount,
    floor(sqrt(p_amount / 100.0))::int,
    CURRENT_DATE,
    v_new_streak,
    v_new_longest
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_xp.total_xp + p_amount,
    level = floor(sqrt((user_xp.total_xp + p_amount) / 100.0))::int,
    last_activity_date = CURRENT_DATE,
    current_streak = v_new_streak,
    longest_streak = v_new_longest;

  RETURN p_amount;
END;
$$;

-- Unlock achievement (called from API routes with service_role key only)
CREATE OR REPLACE FUNCTION unlock_achievement(
  p_user_id UUID,
  p_achievement_id TEXT,
  p_tx_signature TEXT DEFAULT NULL,
  p_asset_address TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_achievements (user_id, achievement_id, tx_signature, asset_address)
  VALUES (p_user_id, p_achievement_id, p_tx_signature, p_asset_address)
  ON CONFLICT (user_id, achievement_id) DO UPDATE
    SET tx_signature = COALESCE(EXCLUDED.tx_signature, user_achievements.tx_signature),
        asset_address = COALESCE(EXCLUDED.asset_address, user_achievements.asset_address);
END;
$$;

-- ─────────────────────────────────────────────
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    'user_' || LEFT(NEW.id::text, 8),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  INSERT INTO public.user_xp (user_id, total_xp, level)
  VALUES (NEW.id, 0, 0);

  RETURN NEW;
END;
$$;

-- handle_new_user is a trigger function; it must never be callable directly via
-- PostgREST (#377). Postgres grants EXECUTE to PUBLIC by default on function
-- creation, which exposes it at /rest/v1/rpc/handle_new_user — revoke that. The
-- trigger below still fires (triggers run their function regardless of the
-- caller's EXECUTE grant); only direct RPC calls are blocked.
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────
-- 5a. (RETIRED) profiles.role write-lock
-- ─────────────────────────────────────────────
-- The profiles.role column and its enforce_profile_role_write lockdown trigger
-- were RETIRED by SP1 (migration 20260710120000_drop_teacher_role.sql, applied
-- to prod as ledger 20260711152518). They are intentionally absent here so this
-- snapshot matches prod (#699). Teacher/admin authorization no longer lives on a
-- profiles column. Do NOT re-add the column or trigger.

-- ─────────────────────────────────────────────
-- 5a-bis. LOCK profiles.wallet_address WRITES TO service_role (#408)
-- ─────────────────────────────────────────────
-- This is the surviving profiles escalation lockdown (the role lock above was
-- retired). The self-service profiles RLS policies (auth.uid() = id for
-- INSERT/UPDATE) do not
-- constrain WHICH columns are written, so without this guard any authenticated
-- user could overwrite wallet_address on their own row — clobbering their linked
-- wallet, or squatting an unclaimed wallet before its real owner links it — via
-- a PostgREST INSERT/UPDATE, spoofing the wallet identity that Helius XP
-- resolution and the linked-wallet trust chain rely on. wallet_address is
-- legitimately written only by the two service-role SIWS paths (api/auth/wallet,
-- api/auth/link-wallet). This BEFORE trigger makes it writable only by
-- service_role: non-privileged UPDATEs that change it error; non-privileged
-- INSERTs are coerced back to NULL (the signup path never sets it). SECURITY
-- INVOKER so current_user reflects the actual caller. Live on prod since
-- 2026-07-10. See migration 20260710120000_drop_teacher_role.sql.
CREATE OR REPLACE FUNCTION public.enforce_profile_wallet_write()
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
    IF NEW.wallet_address IS DISTINCT FROM OLD.wallet_address THEN
      RAISE EXCEPTION
        'permission denied: wallet_address may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.wallet_address IS NOT NULL THEN
      NEW.wallet_address := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_wallet_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_wallet_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_wallet_write();

REVOKE EXECUTE ON FUNCTION public.enforce_profile_wallet_write() FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────
-- 5a-ter. LOCK profiles.deleted_at WRITES TO service_role (#1103)
-- ─────────────────────────────────────────────
-- Same escalation class as the wallet lock above, on the account tombstone.
-- deleted_at is what every public read and every login chokepoint keys on, and
-- the column-agnostic self-service UPDATE policy let the tombstoned user clear
-- it: `UPDATE profiles SET deleted_at = NULL, is_public = true` on their own row
-- via PostgREST, using an access token that outlives the deletion, permanently
-- resurrects the account. A SEPARATE trigger rather than a third column in
-- enforce_profile_wallet_write, so replacing that function's body can never
-- revert this guard (or vice versa) — the same shape the referral lock uses.
-- Non-privileged UPDATEs that change it error in EITHER direction (self-delete
-- must go through POST /api/account/delete, which also scrubs PII and revokes
-- sessions); non-privileged INSERTs are coerced back to NULL (handle_new_user
-- never sets it). See migration 20260819200000_deleted_at_write_lock.sql.
CREATE OR REPLACE FUNCTION public.enforce_profile_deleted_at_write()
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
    IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
      RAISE EXCEPTION
        'permission denied: deleted_at may only be changed by service_role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.deleted_at IS NOT NULL THEN
      NEW.deleted_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_profile_deleted_at_write() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_profile_deleted_at_write ON public.profiles;
CREATE TRIGGER trg_enforce_profile_deleted_at_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_deleted_at_write();

-- ─────────────────────────────────────────────
-- 5b. LEADERBOARD RPC
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_timeframe TEXT DEFAULT 'alltime', p_limit INT DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  total_xp BIGINT,
  level INT,
  rank BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_timeframe = 'alltime' THEN
    RETURN QUERY
      SELECT
        ux.user_id,
        p.username,
        p.avatar_url,
        ux.total_xp::BIGINT,
        ux.level,
        ROW_NUMBER() OVER (ORDER BY ux.total_xp DESC)::BIGINT AS rank
      FROM public.user_xp ux
      JOIN public.profiles p ON p.id = ux.user_id
      WHERE ux.total_xp > 0
        AND p.is_public = true
        AND p.deleted_at IS NULL
        AND p.username IS NOT NULL
        AND p.username <> ''
      ORDER BY ux.total_xp DESC
      LIMIT LEAST(p_limit, 100);
  ELSE
    RETURN QUERY
      SELECT
        sub.user_id,
        sub.username,
        sub.avatar_url,
        sub.total_xp,
        COALESCE(ux.level, FLOOR(SQRT(sub.total_xp / 100.0))::INT) AS level,
        ROW_NUMBER() OVER (ORDER BY sub.total_xp DESC)::BIGINT AS rank
      FROM (
        SELECT
          xt.user_id,
          p.username,
          p.avatar_url,
          SUM(xt.amount)::BIGINT AS total_xp
        FROM public.xp_transactions xt
        JOIN public.profiles p ON p.id = xt.user_id
        WHERE p.is_public = true
          AND p.deleted_at IS NULL
          AND p.username IS NOT NULL
          AND p.username <> ''
          AND xt.created_at >= CASE
            WHEN p_timeframe = 'weekly'  THEN NOW() - INTERVAL '7 days'
            WHEN p_timeframe = 'monthly' THEN NOW() - INTERVAL '1 month'
          END
        GROUP BY xt.user_id, p.username, p.avatar_url
      ) sub
      LEFT JOIN public.user_xp ux ON ux.user_id = sub.user_id
      ORDER BY sub.total_xp DESC
      LIMIT LEAST(p_limit, 100);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, INT) TO authenticated, anon;

-- Non-sensitive public XP view: exposes only (user_id, total_xp, level) for
-- public profiles. Owner-privilege view (bypasses RLS on user_xp), so the
-- is_public filter is the access control. Used for public reads (marketing
-- stats, public profiles, community author level badges) now that user_xp is
-- own-row-only.
-- INVARIANT: the is_public + deleted_at filters are the SOLE access guard —
-- removing either would make soft-deleted or private users' XP publicly
-- readable. Do not remove them. (#1105: the deleted_at half was added to prod by
-- 20260704140000_account_deletion.sql and never mirrored here, so every DB
-- rebuilt from this snapshot shipped without it.)
CREATE OR REPLACE VIEW public_user_xp AS
  SELECT ux.user_id, ux.total_xp, ux.level
  FROM user_xp ux
  JOIN profiles p ON p.id = ux.user_id
  WHERE p.is_public = true
    AND p.deleted_at IS NULL;

REVOKE ALL ON public_user_xp FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public_user_xp TO anon, authenticated;

-- public_profiles (#478/#493): the SOLE cross-user profile read surface now that
-- the base table has no public-profile row policy (#493). Exposes only
-- non-sensitive fields for public, non-deleted profiles — never google_id or
-- github_id. Instructor identity resolves by wallet_address; /profile/[username]
-- resolves by username and needs `id` (to key the user's XP/achievements/certs/
-- progress reads) + `created_at` (join date); /certificates/[id] resolves by
-- `id` and needs username + wallet_address. `id` and `created_at` are already
-- public elsewhere (id via public_user_xp/user_achievements/certificates,
-- created_at is the shown join date), so they are safe to project here.
-- The `wallet_address IS NOT NULL` filter is intentionally omitted so a
-- wallet-less public profile (OAuth-only) still resolves on its public pages;
-- it is inert for instructor resolution, which matches a concrete wallet and so
-- never matches a NULL row.
-- INVARIANT: the is_public + deleted_at filters are the access guard; the SELECT
-- list is non-sensitive. Never add google_id/github_id; never drop a filter.
CREATE OR REPLACE VIEW public_profiles AS
  SELECT p.wallet_address, p.username, p.avatar_url, p.bio, p.social_links,
         p.id, p.created_at
  FROM profiles p
  WHERE p.is_public = true
    AND p.deleted_at IS NULL;

REVOKE ALL ON public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public_profiles TO anon, authenticated;

-- ─────────────────────────────────────────────
-- 6. RESTRICT SECURITY DEFINER FUNCTIONS
-- ─────────────────────────────────────────────
-- F-06 & F-07: Revoke direct RPC access from client roles.
-- These functions must only be callable via service_role (API routes).
REVOKE EXECUTE ON FUNCTION award_xp FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION unlock_achievement FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION award_xp TO service_role;
GRANT EXECUTE ON FUNCTION unlock_achievement TO service_role;

-- ─────────────────────────────────────────────
-- 7. STORAGE — AVATAR BUCKET
-- ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- Deployed Programs (student program deployments on devnet)
-- ============================================================================

CREATE TABLE deployed_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'devnet',
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id, lesson_id)
);

CREATE INDEX idx_deployed_programs_user_id ON deployed_programs(user_id);
CREATE INDEX idx_deployed_programs_course_id ON deployed_programs(course_id);

ALTER TABLE deployed_programs ENABLE ROW LEVEL SECURITY;

-- NOTE: All writes to this table go through service_role (/api/deploy/save,
-- after on-chain verification of the submitted program id — #560 / LX-E1).
-- No INSERT/UPDATE RLS policies exist because authenticated/anon roles never
-- write directly; a client-writable row would bypass the verification and let
-- a learner claim anyone's public program as their own deploy
-- (20260726121000_lockdown_deployed_programs_rls.sql).
CREATE POLICY "Users can view their own deployments"
  ON deployed_programs FOR SELECT USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 8. PENDING ON-CHAIN ACTIONS (retry queue)
-- ─────────────────────────────────────────────

-- NOTE: All writes to this table go through service_role (API routes) or SECURITY DEFINER functions.
-- No INSERT/UPDATE RLS policies are needed because authenticated/anon roles never write directly.
CREATE TABLE pending_onchain_actions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type    TEXT NOT NULL CHECK (action_type IN ('achievement', 'certificate', 'course_finalize', 'xp', 'quest_xp', 'enroll')),
  reference_id   TEXT NOT NULL,
  payload        JSONB NOT NULL,
  failed_at      TIMESTAMPTZ DEFAULT NOW(),
  retry_count    INT DEFAULT 0,
  last_error     TEXT,
  resolved_at    TIMESTAMPTZ,
  UNIQUE(user_id, action_type, reference_id)
);

CREATE INDEX idx_pending_onchain_actions_user_id
  ON pending_onchain_actions(user_id)
  WHERE resolved_at IS NULL;

ALTER TABLE pending_onchain_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_pending_actions"
  ON pending_onchain_actions
  FOR SELECT USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- DAILY QUESTS
-- ═══════════════════════════════════════════════════════════════

-- NOTE: All writes to this table go through service_role (API routes) or SECURITY DEFINER functions.
-- No INSERT/UPDATE RLS policies are needed because authenticated/anon roles never write directly.
CREATE TABLE user_daily_quests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id      TEXT NOT NULL,
  current_value INTEGER DEFAULT 0,
  completed     BOOLEAN DEFAULT false,
  completed_at  TIMESTAMPTZ,
  xp_granted    BOOLEAN DEFAULT false,
  period_start  DATE NOT NULL,
  UNIQUE(user_id, quest_id, period_start)
);

CREATE INDEX idx_user_daily_quests_user_period
  ON user_daily_quests(user_id, period_start);

ALTER TABLE user_daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily quests"
  ON user_daily_quests FOR SELECT USING (auth.uid() = user_id);

-- ── get_daily_quest_state ─────────────────────────────────────
-- Single-pass function: evaluates all quest progress for a user,
-- upserts rows, marks first completion via xp_granted flag.
-- On first completion it ALSO enqueues a 'quest_xp' pending_onchain_actions
-- row in THIS transaction (atomic with the xp_granted flip), so a quest is
-- never marked granted without a durable delivery record. The XP is then
-- credited idempotently by retryPendingOnchainActions() -> award_xp()
-- (reference_id = idempotency key); it is NOT minted on-chain from a retry
-- path, because rewardXp is non-idempotent and would double-mint soulbound XP.
-- Called via service_role from /api/quests/daily.
CREATE OR REPLACE FUNCTION get_daily_quest_state(
  p_user_id           UUID,
  p_quest_definitions JSONB,
  p_challenge_ids     TEXT[],
  p_module_lesson_map JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_quest        JSONB;
  v_quest_id     TEXT;
  v_type         TEXT;
  v_target       INTEGER;
  v_xp           INTEGER;
  v_reset_type   TEXT;
  v_current      INTEGER;
  v_period       DATE;
  v_existing     RECORD;
  v_results      JSONB := '[]'::JSONB;
  v_mod          JSONB;
  v_mod_lessons  TEXT[];
  v_all_done     BOOLEAN;
  v_max_date     DATE;
  v_just_awarded BOOLEAN;
  v_completed    BOOLEAN;
BEGIN
  FOR v_quest IN SELECT * FROM jsonb_array_elements(p_quest_definitions)
  LOOP
    v_quest_id   := v_quest->>'id';
    v_type       := v_quest->>'type';
    v_target     := (v_quest->>'targetValue')::INTEGER;
    v_xp         := (v_quest->>'xpReward')::INTEGER;
    v_reset_type := v_quest->>'resetType';
    v_current    := 0;
    v_just_awarded := false;

    -- ── Calculate current_value per quest type ──
    IF v_type = 'lesson' OR v_type = 'lesson_batch' THEN
      SELECT COUNT(*)::INTEGER INTO v_current
      FROM public.user_progress
      WHERE user_id = p_user_id
        AND completed = true
        AND completed_at::date = CURRENT_DATE;

    ELSIF v_type = 'challenge' THEN
      SELECT COUNT(*)::INTEGER INTO v_current
      FROM public.user_progress
      WHERE user_id = p_user_id
        AND completed = true
        AND completed_at::date = CURRENT_DATE
        AND lesson_id = ANY(p_challenge_ids);

    ELSIF v_type = 'login_streak' THEN
      -- Dashboard load = login signal.
      -- Find the most recent active (non-completed) streak row for this quest.
      SELECT * INTO v_existing
      FROM public.user_daily_quests
      WHERE user_id = p_user_id
        AND quest_id = v_quest_id
        AND completed = false
      ORDER BY period_start DESC
      LIMIT 1;

      -- Three-case state machine for login streaks.
      -- Let diff = CURRENT_DATE - period_start (days since streak started).
      --
      -- Walkthrough (target = 3):
      --   Day 1 created:       period_start=D1, current_value=1, diff=0
      --   Day 1 reload:        diff=0, cv=1 → diff = cv-1 (0=0) → no-op ✓
      --   Day 2 first load:    diff=1, cv=1 → diff = cv   (1=1) → increment to 2 ✓
      --   Day 2 reload:        diff=1, cv=2 → diff = cv-1 (1=1) → no-op ✓
      --   Day 3 first load:    diff=2, cv=2 → diff = cv   (2=2) → increment to 3 → COMPLETE ✓
      --   Day 5 (skipped D4):  diff=4, cv=3 → diff > cv   (4>3) → gap, start new ✓

      IF v_existing IS NULL THEN
        -- Case 0: No active streak row — start fresh
        v_current := 1;
        v_period  := CURRENT_DATE;

      ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value - 1 THEN
        -- Case 1: Already counted today (idempotent reload) — no-op
        -- diff = cv-1 means today is the same day as the last increment
        v_current := v_existing.current_value;
        v_period  := v_existing.period_start;

      ELSIF (CURRENT_DATE - v_existing.period_start)::INTEGER = v_existing.current_value THEN
        -- Case 2: Unbroken streak, new day — increment
        -- diff = cv means yesterday was the last counted day
        v_current := v_existing.current_value + 1;
        v_period  := v_existing.period_start;

      ELSIF public.cover_missed_days_with_freezes(
              p_user_id,
              v_existing.period_start + v_existing.current_value,
              CURRENT_DATE - 1) THEN
        -- Case 3a (LX-B8): diff > cv — gap, but freezes cover every missed day,
        -- so the quest streak survives and today's login increments it. Missed
        -- days run from the first uncounted day (period_start + current_value)
        -- through yesterday, using the SAME freeze log as the headline streak so
        -- the two agree.
        v_current := v_existing.current_value + 1;
        v_period  := v_existing.period_start;

      ELSE
        -- Case 3b: diff > cv, no freeze — streak broken, start new
        v_current := 1;
        v_period  := CURRENT_DATE;
      END IF;

      -- Completion requires a positive target: a targetValue of 0 must NOT
      -- auto-complete (that would mint free XP every day for a 0-target quest).
      v_completed := v_target > 0 AND v_current >= v_target;

      -- Upsert the streak row and skip the generic upsert below
      INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
      VALUES (p_user_id, v_quest_id, v_current, v_completed, CASE WHEN v_completed THEN NOW() ELSE NULL END, false, v_period)
      ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
        current_value = EXCLUDED.current_value,
        completed     = EXCLUDED.completed,
        completed_at  = EXCLUDED.completed_at;

      -- Mark xp_granted on first completion and durably enqueue the XP credit
      -- in the SAME transaction (atomic with the flip): a quest is never marked
      -- granted without a pending_onchain_actions row, so the enqueue can never
      -- be lost to a swallowed app-side error. retryPendingOnchainActions()
      -- delivers it idempotently via award_xp (reference_id = idempotency key).
      IF v_completed THEN
        UPDATE public.user_daily_quests
        SET xp_granted = true
        WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;

        IF FOUND THEN
          v_just_awarded := true;
          INSERT INTO public.pending_onchain_actions (user_id, action_type, reference_id, payload)
          VALUES (
            p_user_id,
            'quest_xp',
            v_quest_id || ':' || v_period::text,
            jsonb_build_object('xpAmount', v_xp, 'memo', 'daily_quest:' || v_quest_id)
          )
          ON CONFLICT (user_id, action_type, reference_id) DO NOTHING;

          -- Quest reward that funds forgiveness (LX-B8): completing the
          -- consistency quest banks a streak freeze (capped at 2, server-side),
          -- on first completion only (guarded by the xp_granted flip above).
          PERFORM public.grant_streak_freeze(p_user_id);
        END IF;
      END IF;

      v_results := v_results || jsonb_build_object(
        'questId', v_quest_id,
        'currentValue', v_current,
        'completed', v_completed,
        'justAwarded', v_just_awarded,
        'xpReward', v_xp
      );
      CONTINUE;  -- Skip generic upsert

    ELSIF v_type = 'module' THEN
      -- Check if ALL lessons in ANY module are completed AND the last one was completed today
      v_current := 0;
      FOR v_mod IN SELECT * FROM jsonb_array_elements(p_module_lesson_map)
      LOOP
        v_mod_lessons := ARRAY(SELECT jsonb_array_elements_text(v_mod->'lessonIds'));
        IF array_length(v_mod_lessons, 1) IS NULL OR array_length(v_mod_lessons, 1) = 0 THEN
          CONTINUE;
        END IF;

        -- Check all lessons completed
        SELECT COUNT(*) = array_length(v_mod_lessons, 1) INTO v_all_done
        FROM public.user_progress
        WHERE user_id = p_user_id
          AND completed = true
          AND lesson_id = ANY(v_mod_lessons);

        IF v_all_done THEN
          -- Check if the most recent completion in this module was today
          SELECT MAX(completed_at::date) INTO v_max_date
          FROM public.user_progress
          WHERE user_id = p_user_id
            AND completed = true
            AND lesson_id = ANY(v_mod_lessons);

          IF v_max_date = CURRENT_DATE THEN
            v_current := 1;
            EXIT;  -- One completed module is enough
          END IF;
        END IF;
      END LOOP;

    ELSIF v_type = 'review' THEN
      -- Reviews CLEARED today = the learner's own review_items passed today.
      -- A pass advances the item's spacing box (record_review_result); a miss
      -- resets it to box 1 with last_result=false, which is NOT a clear and so
      -- must not count. Additive branch: it only computes v_current and falls
      -- through to the generic upsert below, so the xp_granted /
      -- pending_onchain_actions atomicity invariant is inherited unchanged and
      -- no other quest type is affected.
      SELECT COUNT(*)::INTEGER INTO v_current
      FROM public.review_items
      WHERE user_id = p_user_id
        AND last_result = true
        AND last_reviewed_at::date = CURRENT_DATE;

    ELSE
      -- Unknown quest type (e.g. a CMS typo). Skip this ONE quest with a loud
      -- server-log warning rather than RAISE-ing — a single mis-typed quest
      -- definition must not 500 the whole daily-quests endpoint for every user
      -- (and, now that the enqueue is transactional, roll back other quests'
      -- durable XP rows in the same call). It is not rendered as a silent 0/N:
      -- it is omitted from the result and flagged in the logs for the operator.
      RAISE WARNING 'get_daily_quest_state: skipping unknown quest type: %', v_type;
      CONTINUE;
    END IF;

    -- ── Generic daily quest upsert (lesson, lesson_batch, challenge, module) ──
    v_period := CURRENT_DATE;

    -- Completion requires a positive target: a targetValue of 0 must NOT
    -- auto-complete (that would mint free XP every day for a 0-target quest).
    v_completed := v_target > 0 AND v_current >= v_target;

    INSERT INTO public.user_daily_quests (user_id, quest_id, current_value, completed, completed_at, xp_granted, period_start)
    VALUES (p_user_id, v_quest_id, v_current, v_completed, CASE WHEN v_completed THEN NOW() ELSE NULL END, false, v_period)
    ON CONFLICT (user_id, quest_id, period_start) DO UPDATE SET
      current_value = EXCLUDED.current_value,
      completed     = EXCLUDED.completed,
      completed_at  = COALESCE(user_daily_quests.completed_at, EXCLUDED.completed_at);

    -- Mark xp_granted on first completion and durably enqueue the XP credit in
    -- the SAME transaction (atomic with the flip) — see the login_streak branch.
    IF v_completed THEN
      UPDATE public.user_daily_quests
      SET xp_granted = true
      WHERE user_id = p_user_id AND quest_id = v_quest_id AND period_start = v_period AND xp_granted = false;

      IF FOUND THEN
        v_just_awarded := true;
        INSERT INTO public.pending_onchain_actions (user_id, action_type, reference_id, payload)
        VALUES (
          p_user_id,
          'quest_xp',
          v_quest_id || ':' || v_period::text,
          jsonb_build_object('xpAmount', v_xp, 'memo', 'daily_quest:' || v_quest_id)
        )
        ON CONFLICT (user_id, action_type, reference_id) DO NOTHING;
      END IF;
    END IF;

    v_results := v_results || jsonb_build_object(
      'questId', v_quest_id,
      'currentValue', v_current,
      'completed', v_completed,
      'justAwarded', v_just_awarded,
      'xpReward', v_xp
    );
  END LOOP;

  RETURN v_results;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_daily_quest_state FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION get_daily_quest_state TO service_role;

-- ============================================================
-- Community Forum: Core Tables
-- ============================================================

-- Forum categories (global sections)
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Threads (global + course/lesson scoped)
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 5 AND 200),
  slug TEXT NOT NULL,
  short_id TEXT GENERATED ALWAYS AS (LEFT(id::text, 8)) STORED,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 10 AND 10000),
  type TEXT NOT NULL CHECK (type IN ('question', 'discussion')),

  category_id UUID REFERENCES forum_categories(id),
  course_id TEXT,
  lesson_id TEXT,

  is_solved BOOLEAN NOT NULL DEFAULT false,
  accepted_answer_id UUID,

  answer_count INT NOT NULL DEFAULT 0,
  vote_score INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,

  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,

  deleted_at TIMESTAMPTZ,

  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_global_thread_has_category
    CHECK (course_id IS NOT NULL OR category_id IS NOT NULL)
);

-- Answers (flat, Stack Overflow style)
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  vote_score INT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK from threads.accepted_answer_id → answers (deferred, answers table must exist first)
ALTER TABLE threads
  ADD CONSTRAINT fk_threads_accepted_answer
  FOREIGN KEY (accepted_answer_id) REFERENCES answers(id) ON DELETE SET NULL;

-- Votes (polymorphic: either thread or answer, never both)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_vote_target_exclusive CHECK (
    (thread_id IS NOT NULL AND answer_id IS NULL) OR
    (thread_id IS NULL AND answer_id IS NOT NULL)
  )
);

-- Partial unique indexes (NULL != NULL in Postgres UNIQUE constraints)
CREATE UNIQUE INDEX votes_user_thread_unique
  ON votes(user_id, thread_id) WHERE thread_id IS NOT NULL;
CREATE UNIQUE INDEX votes_user_answer_unique
  ON votes(user_id, answer_id) WHERE answer_id IS NOT NULL;

-- Flags (moderation)
CREATE TABLE flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'off-topic', 'other')),
  details TEXT CHECK (details IS NULL OR length(details) <= 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_flag_target_exclusive CHECK (
    (thread_id IS NOT NULL AND answer_id IS NULL) OR
    (thread_id IS NULL AND answer_id IS NOT NULL)
  )
);

-- ============================================================
-- Community Forum: Indexes
-- ============================================================

CREATE INDEX idx_threads_last_activity ON threads(last_activity_at DESC, id DESC);
CREATE INDEX idx_threads_category ON threads(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_threads_course ON threads(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_threads_lesson ON threads(lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX idx_threads_author ON threads(author_id);
CREATE INDEX idx_threads_type_unsolved ON threads(type, is_solved) WHERE type = 'question' AND is_solved = false;
CREATE INDEX idx_threads_short_id ON threads(short_id);
-- FK index so answers.id deletes (ON DELETE SET NULL on threads.accepted_answer_id)
-- do not seq-scan threads. Partial: only threads with an accepted answer.
CREATE INDEX IF NOT EXISTS idx_threads_accepted_answer_id ON threads(accepted_answer_id) WHERE accepted_answer_id IS NOT NULL;

CREATE INDEX idx_answers_thread ON answers(thread_id);
CREATE INDEX idx_answers_author ON answers(author_id);
CREATE INDEX idx_threads_deleted ON threads(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_answers_deleted ON answers(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_votes_thread ON votes(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_votes_answer ON votes(answer_id) WHERE answer_id IS NOT NULL;
CREATE INDEX idx_votes_user ON votes(user_id);

CREATE INDEX idx_flags_status ON flags(status) WHERE status = 'pending';

-- Prevent duplicate flags: one flag per user per target
CREATE UNIQUE INDEX IF NOT EXISTS idx_flags_unique_thread
  ON flags (reporter_id, thread_id) WHERE thread_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_flags_unique_answer
  ON flags (reporter_id, answer_id) WHERE answer_id IS NOT NULL;

-- FK indexes so ON DELETE CASCADE / SET NULL paths and reverse lookups do not
-- seq-scan. The unique indexes above lead with reporter_id, so they do not
-- serve standalone thread_id / answer_id; resolved_by has no other index.
CREATE INDEX IF NOT EXISTS idx_flags_thread_id
  ON flags (thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flags_answer_id
  ON flags (answer_id) WHERE answer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flags_reporter_id
  ON flags (reporter_id);
CREATE INDEX IF NOT EXISTS idx_flags_resolved_by
  ON flags (resolved_by) WHERE resolved_by IS NOT NULL;

-- Full-text search on threads (weighted: title A, body B)
ALTER TABLE threads ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) STORED;
CREATE INDEX idx_threads_search ON threads USING gin(search_vector);

-- Seed default categories
INSERT INTO forum_categories (name, slug, description, sort_order) VALUES
  ('General', 'general', 'General Solana development discussions', 1),
  ('Help', 'help', 'Ask questions and get help from the community', 2),
  ('Showcase', 'showcase', 'Share your projects and achievements', 3),
  ('Off-Topic', 'off-topic', 'Everything else', 4);

-- ============================================================
-- Community Forum: Triggers
-- ============================================================

-- Prevent self-voting
CREATE OR REPLACE FUNCTION prevent_self_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  content_author_id UUID;
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    SELECT author_id INTO content_author_id FROM public.threads WHERE id = NEW.thread_id;
  ELSE
    SELECT author_id INTO content_author_id FROM public.answers WHERE id = NEW.answer_id;
  END IF;

  IF content_author_id = NEW.user_id THEN
    RAISE EXCEPTION 'Cannot vote on your own content';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_self_vote
  BEFORE INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION prevent_self_vote();

-- Prevent self-flagging (users cannot flag their own content)
CREATE OR REPLACE FUNCTION prevent_self_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.threads WHERE id = NEW.thread_id AND author_id = NEW.reporter_id) THEN
      RAISE EXCEPTION 'Cannot flag your own content';
    END IF;
  END IF;
  IF NEW.answer_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.answers WHERE id = NEW.answer_id AND author_id = NEW.reporter_id) THEN
      RAISE EXCEPTION 'Cannot flag your own content';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_self_flag
  BEFORE INSERT ON flags
  FOR EACH ROW EXECUTE FUNCTION prevent_self_flag();

-- Update denormalized vote_score on threads/answers.
-- SECURITY DEFINER so the write to the protected vote_score column succeeds
-- regardless of the voter's column-level privileges (authors are not granted
-- UPDATE on vote_score).
CREATE OR REPLACE FUNCTION update_vote_score()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.thread_id IS NOT NULL THEN
      UPDATE public.threads SET vote_score = vote_score + NEW.value WHERE id = NEW.thread_id;
    ELSE
      UPDATE public.answers SET vote_score = vote_score + NEW.value WHERE id = NEW.answer_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.thread_id IS NOT NULL THEN
      UPDATE public.threads SET vote_score = vote_score + (NEW.value - OLD.value) WHERE id = NEW.thread_id;
    ELSE
      UPDATE public.answers SET vote_score = vote_score + (NEW.value - OLD.value) WHERE id = NEW.answer_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.thread_id IS NOT NULL THEN
      UPDATE public.threads SET vote_score = vote_score - OLD.value WHERE id = OLD.thread_id;
    ELSE
      UPDATE public.answers SET vote_score = vote_score - OLD.value WHERE id = OLD.answer_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vote_score
  AFTER INSERT OR UPDATE OF value OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_score();

-- Update answer_count on threads.
-- SECURITY DEFINER so posting an answer (authenticated client) can bump the
-- protected answer_count column, which authors are not granted UPDATE on.
CREATE OR REPLACE FUNCTION update_answer_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.threads SET answer_count = answer_count + 1 WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.threads SET answer_count = answer_count - 1 WHERE id = OLD.thread_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_answer_count
  AFTER INSERT OR DELETE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_answer_count();

-- Update last_activity_at on new answers only (not edits, to prevent gaming thread sort order).
-- SECURITY DEFINER so posting an answer (authenticated client) can bump the
-- protected last_activity_at column, which authors are not granted UPDATE on.
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.threads SET last_activity_at = now() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_last_activity
  AFTER INSERT ON answers
  FOR EACH ROW EXECUTE FUNCTION update_last_activity();

-- update_vote_score / update_answer_count / update_last_activity are SECURITY
-- DEFINER (they write protected denormalized columns regardless of the caller's
-- column privileges). They run only in trigger context, which does not require
-- EXECUTE, so drop the default PUBLIC execute grant — they must never be
-- callable via PostgREST RPC.
REVOKE EXECUTE ON FUNCTION update_vote_score()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_answer_count()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_last_activity() FROM PUBLIC, anon, authenticated;

-- Maintain updated_at on genuine content edits only (not on the denormalized
-- counter updates above, which would otherwise make updated_at track activity
-- rather than edits). updated_at is server-owned — the author GRANTs below do
-- not include it, so it can't be forged.
CREATE OR REPLACE FUNCTION set_thread_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.type IS DISTINCT FROM OLD.type
     OR NEW.category_id IS DISTINCT FROM OLD.category_id
     OR NEW.course_id IS DISTINCT FROM OLD.course_id
     OR NEW.lesson_id IS DISTINCT FROM OLD.lesson_id THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_answer_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.body IS DISTINCT FROM OLD.body THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_threads_set_updated_at
  BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION set_thread_updated_at();

CREATE OR REPLACE TRIGGER trg_answers_set_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION set_answer_updated_at();

-- ============================================================
-- Community Forum: SECURITY DEFINER Functions
-- ============================================================

-- Per-user view dedup: only count one view per user per thread per 15-minute window.
-- Anonymous views (p_user_id IS NULL) always increment.
CREATE TABLE IF NOT EXISTS thread_views (
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id  UUID REFERENCES threads(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, thread_id)
);

-- The PK leads with user_id, so deleting a thread (cascade on thread_id) would
-- seq-scan without this.
CREATE INDEX IF NOT EXISTS idx_thread_views_thread_id
  ON thread_views (thread_id);

ALTER TABLE thread_views ENABLE ROW LEVEL SECURITY;
-- No RLS policies needed — all access via service_role through increment_view_count().

CREATE OR REPLACE FUNCTION increment_view_count(p_thread_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    UPDATE public.threads SET view_count = view_count + 1 WHERE id = p_thread_id;
    RETURN;
  END IF;

  INSERT INTO public.thread_views (user_id, thread_id, viewed_at)
  VALUES (p_user_id, p_thread_id, NOW())
  ON CONFLICT (user_id, thread_id) DO UPDATE
    SET viewed_at = NOW()
    WHERE thread_views.viewed_at < NOW() - INTERVAL '15 minutes';

  IF FOUND THEN
    UPDATE public.threads SET view_count = view_count + 1 WHERE id = p_thread_id;
  END IF;
END;
$$;

-- Award community XP with daily cap (50/day total, 10/day vote sub-cap)
CREATE OR REPLACE FUNCTION award_community_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_daily_total INTEGER;
  v_daily_vote_total INTEGER;
  v_is_vote_xp BOOLEAN;
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
  v_new_longest INTEGER;
BEGIN
  IF p_amount <= 0 THEN RETURN FALSE; END IF;

  -- Serialize concurrent community awards for the same user so the read-then-
  -- insert daily cap below is atomic (mirrors the lock added to award_xp in
  -- #179). A distinct key namespace avoids contending with award_xp's lock —
  -- the two functions count disjoint xp_transactions rows (community:% vs NOT
  -- community:%), so they need not serialize against each other.
  PERFORM pg_advisory_xact_lock(hashtext('award_community_xp:' || p_user_id::text)::bigint);

  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.xp_transactions
  WHERE user_id = p_user_id
    AND reason LIKE 'community:%'
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

  IF v_daily_total >= 50 THEN RETURN FALSE; END IF;

  v_is_vote_xp := p_reason LIKE 'community:upvote%';
  IF v_is_vote_xp THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_daily_vote_total
    FROM public.xp_transactions
    WHERE user_id = p_user_id
      AND reason LIKE 'community:upvote%'
      AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

    IF v_daily_vote_total >= 10 THEN RETURN FALSE; END IF;

    IF v_daily_vote_total + p_amount > 10 THEN
      p_amount := 10 - v_daily_vote_total;
    END IF;
    IF p_amount <= 0 THEN RETURN FALSE; END IF;
  END IF;

  IF v_daily_total + p_amount > 50 THEN
    p_amount := 50 - v_daily_total;
  END IF;
  IF p_amount <= 0 THEN RETURN FALSE; END IF;

  -- source is hardcoded: this function IS the community XP path (LX-B9a). All
  -- callers pass 'community:%' reasons — the daily-cap accounting above
  -- already depends on that convention.
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO public.xp_transactions (user_id, amount, reason, source, idempotency_key)
    VALUES (p_user_id, p_amount, p_reason, 'community', p_idempotency_key)
    ON CONFLICT (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL
    DO NOTHING;

    IF NOT FOUND THEN RETURN FALSE; END IF;
  ELSE
    INSERT INTO public.xp_transactions (user_id, amount, reason, source)
    VALUES (p_user_id, p_amount, p_reason, 'community');
  END IF;

  -- Shared forgiveness-aware streak decision (identical rail to award_xp): the
  -- prior inline CASE hard-reset a frozen streak whenever community XP was the
  -- day's first write. Read the streak state, then defer to next_streak_value.
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.user_xp
  WHERE user_id = p_user_id;

  v_new_streak := public.next_streak_value(p_user_id, v_last_activity, v_current_streak, CURRENT_DATE);
  v_new_longest := GREATEST(COALESCE(v_longest_streak, 0), v_new_streak);

  INSERT INTO public.user_xp (id, user_id, total_xp, level, current_streak, longest_streak, last_activity_date)
  VALUES (
    gen_random_uuid(), p_user_id, p_amount,
    floor(sqrt(p_amount / 100.0))::int,
    v_new_streak, v_new_longest, CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_xp.total_xp + p_amount,
    level = floor(sqrt((user_xp.total_xp + p_amount) / 100.0))::int,
    last_activity_date = CURRENT_DATE,
    current_streak = v_new_streak,
    longest_streak = v_new_longest;

  RETURN TRUE;
END;
$$;

-- Revoke community XP (for vote removals — deletes transaction, decrements user_xp)
CREATE OR REPLACE FUNCTION revoke_community_xp(
  p_user_id UUID,
  p_idempotency_key TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_amount INTEGER;
BEGIN
  DELETE FROM public.xp_transactions
  WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
  RETURNING amount INTO v_amount;

  IF v_amount IS NOT NULL THEN
    UPDATE public.user_xp SET
      total_xp = GREATEST(0, total_xp - v_amount),
      level = floor(sqrt(GREATEST(0, total_xp - v_amount) / 100.0))::int
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Atomic thread creation (INSERT + slug update in one transaction)
CREATE OR REPLACE FUNCTION create_thread(
  p_author_id UUID, p_title TEXT, p_body TEXT, p_type TEXT,
  p_category_id UUID, p_course_id TEXT, p_lesson_id TEXT, p_slug_base TEXT
) RETURNS TABLE(id UUID, short_id TEXT, slug TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id UUID;
  v_short_id TEXT;
  v_slug TEXT;
BEGIN
  INSERT INTO public.threads (author_id, title, slug, body, type, category_id, course_id, lesson_id)
  VALUES (p_author_id, p_title, p_slug_base, p_body, p_type, p_category_id, p_course_id, p_lesson_id)
  RETURNING threads.id, threads.short_id INTO v_id, v_short_id;

  v_slug := p_slug_base || '-' || v_short_id;
  UPDATE public.threads SET slug = v_slug WHERE threads.id = v_id;

  RETURN QUERY SELECT v_id, v_short_id, v_slug;
END;
$$;

REVOKE ALL ON FUNCTION increment_view_count(UUID, UUID) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count(UUID, UUID) TO service_role;

REVOKE ALL ON FUNCTION award_community_xp(UUID, INTEGER, TEXT, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION award_community_xp(UUID, INTEGER, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION revoke_community_xp(UUID, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION revoke_community_xp(UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION create_thread(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_thread(UUID, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;

-- Soft-delete a thread and cascade to its answers
CREATE OR REPLACE FUNCTION soft_delete_thread(p_thread_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.threads WHERE id = p_thread_id AND author_id = p_user_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Thread not found or not owned by user';
  END IF;
  UPDATE public.threads SET deleted_at = NOW() WHERE id = p_thread_id;
  UPDATE public.answers SET deleted_at = NOW() WHERE thread_id = p_thread_id AND deleted_at IS NULL;
END;
$$;

-- Soft-delete a single answer (decrements count, unmarks solved if was accepted)
CREATE OR REPLACE FUNCTION soft_delete_answer(p_answer_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_thread_id UUID;
  v_was_accepted BOOLEAN;
BEGIN
  SELECT thread_id, is_accepted INTO v_thread_id, v_was_accepted
  FROM public.answers
  WHERE id = p_answer_id AND author_id = p_user_id AND deleted_at IS NULL;

  IF v_thread_id IS NULL THEN
    RAISE EXCEPTION 'Answer not found or not owned by user';
  END IF;

  UPDATE public.answers SET deleted_at = NOW() WHERE id = p_answer_id;
  UPDATE public.threads SET answer_count = GREATEST(answer_count - 1, 0) WHERE id = v_thread_id;

  IF v_was_accepted THEN
    UPDATE public.threads SET is_solved = FALSE, accepted_answer_id = NULL WHERE id = v_thread_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION soft_delete_thread(UUID, UUID) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION soft_delete_thread(UUID, UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION soft_delete_answer(UUID, UUID) FROM authenticated, anon, public;
GRANT EXECUTE ON FUNCTION soft_delete_answer(UUID, UUID) TO service_role;

-- ============================================================
-- Community Forum: RLS Policies
-- ============================================================

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON forum_categories FOR SELECT USING (true);

CREATE POLICY "Anyone can view threads"
  ON threads FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create threads"
  ON threads FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Authors may update only their own threads (row restriction). Column-level
-- privileges below (GRANT UPDATE on specific columns) restrict WHICH columns an
-- author may write; RLS UPDATE policies cannot constrain columns on their own.
-- Moderation/denormalized columns (vote_score, answer_count, view_count,
-- is_solved, accepted_answer_id, is_pinned, is_locked, last_activity_at, slug,
-- deleted_at) are written only by triggers, SECURITY DEFINER RPCs, or service_role.
CREATE POLICY "Authors can update own threads"
  ON threads FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

REVOKE UPDATE ON threads FROM authenticated;
-- updated_at is omitted: it is maintained server-side by trg_threads_set_updated_at.
GRANT UPDATE (title, body, type, category_id, course_id, lesson_id)
  ON threads TO authenticated;
-- anon has no UPDATE RLS policy, so this grant is inert, but revoke it for
-- defense-in-depth (Supabase default privileges may grant it on fresh deploys).
REVOKE UPDATE ON threads FROM anon;

-- No DELETE policy needed. Soft delete is handled via soft_delete_thread() SECURITY DEFINER function.

CREATE POLICY "Anyone can view answers"
  ON answers FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Authenticated users can create answers"
  ON answers FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Authors may update only their own answers (row restriction). Column-level
-- privileges below restrict authors to editing the body; is_accepted and
-- vote_score are written only by the accept route (service_role) and the
-- vote-score trigger respectively.
CREATE POLICY "Authors can update own answers"
  ON answers FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

REVOKE UPDATE ON answers FROM authenticated;
-- updated_at is omitted: it is maintained server-side by trg_answers_set_updated_at.
GRANT UPDATE (body) ON answers TO authenticated;
REVOKE UPDATE ON answers FROM anon;

-- No DELETE policy needed. Soft delete is handled via soft_delete_answer() SECURITY DEFINER function.

CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own votes"
  ON votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create flags"
  ON flags FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- ============================================================
-- Community Stats View
-- ============================================================

-- Owner-privilege view (bypasses RLS) so it can aggregate community XP from
-- xp_transactions, which is no longer client-readable (P1-6).
-- NOTE: this intentionally reverts P0-B1's security_invoker = true. With
-- security_invoker the view runs as the caller, who can no longer read other
-- users' xp_transactions, so total_community_xp would be zeroed for every row
-- except the caller's own. Running as owner restores the aggregate; the explicit
-- "is_public OR own" guard below preserves the P0-B1 guarantee that anon cannot
-- see aggregates for private profiles (and authenticated users still see their own).
CREATE VIEW community_stats AS
SELECT
  p.id AS user_id,
  COUNT(DISTINCT t.id) AS total_threads,
  COUNT(DISTINCT a.id) AS total_answers,
  COUNT(DISTINCT a.id) FILTER (WHERE a.is_accepted) AS accepted_answers,
  COALESCE(SUM(xt.amount) FILTER (WHERE xt.reason LIKE 'community:%'), 0) AS total_community_xp
FROM profiles p
LEFT JOIN threads t ON t.author_id = p.id
LEFT JOIN answers a ON a.author_id = p.id
LEFT JOIN xp_transactions xt ON xt.user_id = p.id
WHERE p.is_public = true OR p.id = auth.uid()
GROUP BY p.id;

-- Explicit grants: publicly queryable, but the WHERE guard limits each caller
-- to public profiles plus their own row.
REVOKE ALL ON community_stats FROM PUBLIC, anon, authenticated;
GRANT SELECT ON community_stats TO anon, authenticated;

-- ============================================================
-- Shared rate-limit store (P1-7)
-- ============================================================
-- Atomic, cross-instance fixed-window limiter. Counted up via check_rate_limit()
-- (service_role); lock-style keys (maxTokens: 1) are also handed back early by a
-- direct service_role DELETE (see releaseRateLimit in lib/rate-limit.ts). The
-- table is service_role-only (no RLS policies), so both paths are privileged.

CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT        NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  -- First row for a (key, window) represents the first request, so DEFAULT 1.
  count        INT         NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

-- Supports the global cleanup sweep below (range scan on window_start).
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start
  ON rate_limits (window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (which bypasses RLS) may touch this table.

-- Returns TRUE when the caller is OVER budget for the current window (reject),
-- having counted this request.
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key            TEXT,
  p_max_tokens     INT,
  p_window_seconds INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count        INT;
BEGIN
  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  DELETE FROM public.rate_limits
  WHERE key = p_key AND window_start < v_window_start;

  INSERT INTO public.rate_limits (key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO v_count;

  -- Per-key pruning above only covers keys that come back. Sweep abandoned rows
  -- from keys that never return on a small fraction of calls, so the table
  -- stays bounded without depending on pg_cron being enabled.
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits
    WHERE window_start < now() - INTERVAL '1 hour';
  END IF;

  RETURN v_count > p_max_tokens;
END;
$$;

REVOKE ALL ON FUNCTION check_rate_limit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) TO service_role;

-- Per-lesson completion counts for the teacher analytics funnel (#286).
-- Aggregated in Postgres so it returns one row per lesson (not raw progress
-- rows, which PostgREST caps at max_rows=1000 and would silently truncate).
-- SECURITY DEFINER: aggregates across all learners, returns only counts.
CREATE OR REPLACE FUNCTION course_lesson_completion_counts(p_course_id TEXT)
RETURNS TABLE (lesson_id TEXT, completed_by BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT up.lesson_id, COUNT(*)::bigint
  FROM public.user_progress up
  WHERE up.course_id = p_course_id AND up.completed = true
  GROUP BY up.lesson_id;
$$;

REVOKE ALL ON FUNCTION course_lesson_completion_counts(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION course_lesson_completion_counts(TEXT) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- AI Partner assist budget (challenge page). Per-(user, lesson) count of PAID
-- AI calls spent on a challenge. The paid cap is the cost ceiling, so the
-- spend RPC is atomic (one INSERT..ON CONFLICT) and the TS wrapper treats any
-- error as "deny" (fail CLOSED) — the opposite of check_rate_limit.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_assists (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id   TEXT NOT NULL,
  assists_used INTEGER NOT NULL DEFAULT 0,
  -- Monotonic count of BILLED Gemini generations (one per confirmed 200),
  -- incremented by record_billed_assist and NEVER decremented — the durable
  -- record of real spend against the platform-funded key. Distinct from
  -- assists_used, which the !response.ok refund path can hand back: a billed-but-
  -- useless generation (empty / non-JSON / MAX_TOKENS) still counts here.
  billed_assists INTEGER NOT NULL DEFAULT 0,
  -- Rendered AI Partner chat turns (JSONB array of PartnerMessage) so a
  -- returning learner can review past AI notes without spending another paid
  -- assist. Bounded in practice by MAX_PAID_ASSISTS successful paid actions.
  chat_log    JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Assist-ladder tiers (#864, economics spec §4.2): free_used counts the 2
  -- hidden free turns, assists_used (above) counts the 8 metered turns, and
  -- socratic_used counts the 20 Socratic turns. reset_used_at stamps the
  -- once-per-(user, lesson) self-serve reset (NULL = never used).
  free_used     INTEGER NOT NULL DEFAULT 0,
  socratic_used INTEGER NOT NULL DEFAULT 0,
  reset_used_at TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- Idempotent add for DBs created before chat_log existed (this file predates it).
ALTER TABLE challenge_assists
  ADD COLUMN IF NOT EXISTS chat_log JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Idempotent add for DBs created before the non-refundable billed counter.
ALTER TABLE challenge_assists
  ADD COLUMN IF NOT EXISTS billed_assists INTEGER NOT NULL DEFAULT 0;

-- Idempotent adds for DBs created before the assist ladder (#864).
ALTER TABLE challenge_assists
  ADD COLUMN IF NOT EXISTS free_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE challenge_assists
  ADD COLUMN IF NOT EXISTS socratic_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE challenge_assists
  ADD COLUMN IF NOT EXISTS reset_used_at TIMESTAMPTZ;

ALTER TABLE challenge_assists ENABLE ROW LEVEL SECURITY;
-- No policies: reached only through SECURITY DEFINER RPCs called by service_role.

-- Atomically spend one paid assist if under the cap. Returns whether allowed
-- and the resulting count. Callers pass p_max_paid (4).
CREATE OR REPLACE FUNCTION spend_challenge_assist(
  p_user_id   UUID,
  p_lesson_id TEXT,
  p_max_paid  INT
) RETURNS TABLE (allowed BOOLEAN, used INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_used INT;
BEGIN
  INSERT INTO public.challenge_assists (user_id, lesson_id, assists_used, updated_at)
  VALUES (p_user_id, p_lesson_id, 1, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    assists_used = public.challenge_assists.assists_used + 1,
    updated_at = now()
  RETURNING public.challenge_assists.assists_used INTO v_used;

  IF v_used > p_max_paid THEN
    -- Over the cap: clamp the stored count back to p_max_paid so repeated
    -- denied calls can't let it run away, and deny.
    UPDATE public.challenge_assists
      SET assists_used = p_max_paid
      WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
    RETURN QUERY SELECT false, p_max_paid;
  ELSE
    RETURN QUERY SELECT true, v_used;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION spend_challenge_assist(UUID, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION spend_challenge_assist(UUID, TEXT, INT) TO service_role;

CREATE OR REPLACE FUNCTION get_challenge_assists(p_user_id UUID, p_lesson_id TEXT)
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT assists_used FROM public.challenge_assists
      WHERE user_id = p_user_id AND lesson_id = p_lesson_id), 0);
$$;

REVOKE ALL ON FUNCTION get_challenge_assists(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_challenge_assists(UUID, TEXT) TO service_role;

-- Guarded self-serve reset (#864, P2-5 / owner D-8). BOTH guards live INSIDE
-- this SECURITY DEFINER body (rule R-6), never in the client:
--   * once per (user, lesson): reset_used_at must be NULL;
--   * 7-day rolling cooldown since the lesson's last assist activity
--     (updated_at — frozen at the last ALLOWED spend; denials don't touch it).
-- A successful reset zeroes the three tier counters and stamps reset_used_at;
-- chat_log and billed_assists are preserved (paid-for record / spend audit).
DROP FUNCTION IF EXISTS reset_challenge_assists(UUID, TEXT);
CREATE FUNCTION reset_challenge_assists(p_user_id UUID, p_lesson_id TEXT)
RETURNS TABLE (allowed BOOLEAN, reason TEXT, available_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v RECORD;
BEGIN
  SELECT ca.reset_used_at, ca.updated_at
    INTO v
    FROM public.challenge_assists ca
    WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'nothing_to_reset'::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF v.reset_used_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'already_used'::TEXT, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF now() < v.updated_at + interval '7 days' THEN
    RETURN QUERY SELECT false, 'cooldown'::TEXT, v.updated_at + interval '7 days';
    RETURN;
  END IF;

  UPDATE public.challenge_assists ca
    SET free_used = 0,
        assists_used = 0,
        socratic_used = 0,
        reset_used_at = now(),
        updated_at = now()
    WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id;

  RETURN QUERY SELECT true, 'reset'::TEXT, NULL::TIMESTAMPTZ;
END;
$$;

REVOKE ALL ON FUNCTION reset_challenge_assists(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_challenge_assists(UUID, TEXT) TO service_role;

-- Atomically spend one assist-LADDER turn (#864, spec §4.2): resolves the tier
-- from the stored counts (free → metered → Socratic, in order), increments
-- exactly one counter, and reports which tier the turn landed in — or denies
-- with tier 'exhausted' once every turn is gone (the community handoff). Row-
-- locked so concurrent requests can't both land in a tier's last slot. Denials
-- deliberately do NOT touch updated_at (the reset cooldown anchor).
CREATE OR REPLACE FUNCTION spend_assist_ladder_turn(
  p_user_id      UUID,
  p_lesson_id    TEXT,
  p_free_max     INT,
  p_metered_max  INT,
  p_socratic_max INT
) RETURNS TABLE (allowed BOOLEAN, tier TEXT, free_turns INT, metered_turns INT, socratic_turns INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v RECORD;
BEGIN
  INSERT INTO public.challenge_assists (user_id, lesson_id)
  VALUES (p_user_id, p_lesson_id)
  ON CONFLICT (user_id, lesson_id) DO NOTHING;

  SELECT ca.free_used, ca.assists_used, ca.socratic_used
    INTO v
    FROM public.challenge_assists ca
    WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id
    FOR UPDATE;

  IF v.free_used < p_free_max THEN
    UPDATE public.challenge_assists ca
      SET free_used = ca.free_used + 1, updated_at = now()
      WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id;
    RETURN QUERY SELECT true, 'free'::TEXT, v.free_used + 1, v.assists_used, v.socratic_used;
  ELSIF v.assists_used < p_metered_max THEN
    UPDATE public.challenge_assists ca
      SET assists_used = ca.assists_used + 1, updated_at = now()
      WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id;
    RETURN QUERY SELECT true, 'metered'::TEXT, v.free_used, v.assists_used + 1, v.socratic_used;
  ELSIF v.socratic_used < p_socratic_max THEN
    UPDATE public.challenge_assists ca
      SET socratic_used = ca.socratic_used + 1, updated_at = now()
      WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id;
    RETURN QUERY SELECT true, 'socratic'::TEXT, v.free_used, v.assists_used, v.socratic_used + 1;
  ELSE
    RETURN QUERY SELECT false, 'exhausted'::TEXT, v.free_used, v.assists_used, v.socratic_used;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION spend_assist_ladder_turn(UUID, TEXT, INT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION spend_assist_ladder_turn(UUID, TEXT, INT, INT, INT) TO service_role;

-- Tier-aware decrement-by-one refund (floor 0) for a ladder turn that was
-- spent but never delivered (Gemini never billed) — the ladder sibling of
-- refund_challenge_assist. The route passes the tier the spend landed in.
CREATE OR REPLACE FUNCTION refund_assist_ladder_turn(
  p_user_id   UUID,
  p_lesson_id TEXT,
  p_tier      TEXT
) RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.challenge_assists
    SET
      free_used     = CASE WHEN p_tier = 'free'     THEN GREATEST(free_used - 1, 0)     ELSE free_used END,
      assists_used  = CASE WHEN p_tier = 'metered'  THEN GREATEST(assists_used - 1, 0)  ELSE assists_used END,
      socratic_used = CASE WHEN p_tier = 'socratic' THEN GREATEST(socratic_used - 1, 0) ELSE socratic_used END,
      updated_at = now()
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id
      -- Unrecognized tier: touch NOTHING — an all-ELSE update would still bump
      -- updated_at and silently extend the reset cooldown.
      AND p_tier IN ('free', 'metered', 'socratic');
$$;

REVOKE ALL ON FUNCTION refund_assist_ladder_turn(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION refund_assist_ladder_turn(UUID, TEXT, TEXT) TO service_role;

-- Decrement-by-one, floor 0. Refunds a single paid assist that was spent but
-- never delivered (e.g. the Gemini call failed after spend_challenge_assist
-- already charged it) — NOT reset_challenge_assists, which zeroes the whole
-- lesson and would over-refund every other legitimately-spent assist.
CREATE OR REPLACE FUNCTION refund_challenge_assist(p_user_id UUID, p_lesson_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.challenge_assists
    SET assists_used = GREATEST(assists_used - 1, 0), updated_at = now()
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
$$;

REVOKE ALL ON FUNCTION refund_challenge_assist(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION refund_challenge_assist(UUID, TEXT) TO service_role;

-- Increment-by-one, never decremented. Records that a BILLED Gemini generation
-- occurred for this (user, lesson) — called once per confirmed 200, regardless
-- of whether the output was usable. This is the audit trail of real spend
-- against the platform-funded key; unlike assists_used it is never refunded, so
-- a truncated/empty/malformed-but-billed generation still counts. The row
-- already exists by the time this runs (spend_challenge_assist upserted it on
-- the same paid call), but upsert defensively.
CREATE OR REPLACE FUNCTION record_billed_assist(p_user_id UUID, p_lesson_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.challenge_assists (user_id, lesson_id, billed_assists, updated_at)
  VALUES (p_user_id, p_lesson_id, 1, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    billed_assists = public.challenge_assists.billed_assists + 1,
    updated_at = now();
$$;

REVOKE ALL ON FUNCTION record_billed_assist(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_billed_assist(UUID, TEXT) TO service_role;

-- Append rendered chat turns to a learner's per-lesson AI Partner log.
-- p_entries is a JSONB array (PartnerMessage[]). The row already exists by the
-- time this runs (spend_challenge_assist upserted it on the same paid call),
-- but upsert defensively. Only ever called on a SUCCESSFUL paid response, so it
-- stays aligned with the assists that were actually charged.
CREATE OR REPLACE FUNCTION append_challenge_assist_log(
  p_user_id   UUID,
  p_lesson_id TEXT,
  p_entries   JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_entries IS NULL OR jsonb_typeof(p_entries) <> 'array' THEN
    RETURN;
  END IF;
  INSERT INTO public.challenge_assists (user_id, lesson_id, chat_log, updated_at)
  VALUES (p_user_id, p_lesson_id, p_entries, now())
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    chat_log = public.challenge_assists.chat_log || EXCLUDED.chat_log,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION append_challenge_assist_log(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION append_challenge_assist_log(UUID, TEXT, JSONB) TO service_role;

-- Read a learner's per-lesson LADDER state + chat log for pane rehydration
-- (so returning to a lesson restores past AI notes without a paid model call).
-- reset_state mirrors — for DISPLAY only — the same rules the reset RPC
-- enforces; enforcement never leaves reset_challenge_assists.
DROP FUNCTION IF EXISTS get_challenge_assist_state(UUID, TEXT);
CREATE FUNCTION get_challenge_assist_state(p_user_id UUID, p_lesson_id TEXT)
RETURNS TABLE (
  free_turns INT,
  metered_turns INT,
  socratic_turns INT,
  reset_state TEXT,
  reset_available_at TIMESTAMPTZ,
  chat_log JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    ca.free_used,
    ca.assists_used,
    ca.socratic_used,
    CASE
      WHEN ca.reset_used_at IS NOT NULL THEN 'used'
      WHEN now() < ca.updated_at + interval '7 days' THEN 'cooldown'
      ELSE 'available'
    END,
    -- Reported ONLY while the cooldown is actually running: once the reset is
    -- available (or spent) this is NULL, never a stale past timestamp.
    CASE
      WHEN ca.reset_used_at IS NULL AND now() < ca.updated_at + interval '7 days'
        THEN ca.updated_at + interval '7 days'
      ELSE NULL
    END,
    ca.chat_log
  FROM public.challenge_assists ca
  WHERE ca.user_id = p_user_id AND ca.lesson_id = p_lesson_id;
$$;

REVOKE ALL ON FUNCTION get_challenge_assist_state(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_challenge_assist_state(UUID, TEXT) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- Review spine (LX-B3, #569): spaced-repetition substrate. review_schedule
-- holds the box→interval schedule AS DATA (PED-04: 1/3/7/21 is convention, not
-- evidence — re-tunable by editing rows, never hardcoded in a function; no ML
-- scheduler ever). review_items holds each learner's per-lesson queue. Writes
-- go ONLY through the two SECURITY DEFINER RPCs (challenge_assists hardening);
-- learners read their OWN queue via an own-row SELECT policy. item_key is the
-- raw lesson _id (PDA-seed convention); skills resolve from the bundle at read
-- time, so there is no skill column. The feed (LX-B4) and /review page (LX-B5)
-- build on this; neither is defined here.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS review_schedule (
  box           SMALLINT PRIMARY KEY,
  interval_days INTEGER  NOT NULL CHECK (interval_days > 0)
);

ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Review schedule is viewable by everyone" ON review_schedule;
CREATE POLICY "Review schedule is viewable by everyone"
  ON review_schedule FOR SELECT USING (true);

-- CONVENTION, NOT EVIDENCE (PED-04): 1 / 3 / 7 / 21 days as data.
INSERT INTO review_schedule (box, interval_days) VALUES
  (1, 1),
  (2, 3),
  (3, 7),
  (4, 21)
ON CONFLICT (box) DO NOTHING;

CREATE TABLE IF NOT EXISTS review_items (
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_key       TEXT NOT NULL,
  box            SMALLINT NOT NULL DEFAULT 1 REFERENCES review_schedule(box),
  due_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_result    BOOLEAN,
  last_reviewed_at TIMESTAMPTZ,
  lapses         INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_review_items_user_due
  ON review_items (user_id, due_at);

ALTER TABLE review_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own review items" ON review_items;
CREATE POLICY "Users can view their own review items"
  ON review_items FOR SELECT USING (auth.uid() = user_id);

-- Enqueue a lesson's item at box 1 if absent; existing item left untouched.
CREATE OR REPLACE FUNCTION schedule_review_item(
  p_user_id  UUID,
  p_item_key TEXT
) RETURNS TABLE (box SMALLINT, due_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_interval INT;
BEGIN
  SELECT interval_days INTO v_interval
    FROM public.review_schedule WHERE box = 1;

  INSERT INTO public.review_items (user_id, item_key, box, due_at)
  VALUES (p_user_id, p_item_key, 1, now() + make_interval(days => v_interval))
  ON CONFLICT (user_id, item_key) DO NOTHING;

  RETURN QUERY
    SELECT ri.box, ri.due_at
    FROM public.review_items ri
    WHERE ri.user_id = p_user_id AND ri.item_key = p_item_key;
END;
$$;

REVOKE ALL ON FUNCTION schedule_review_item(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION schedule_review_item(UUID, TEXT) TO service_role;

-- Record a graded review: pass advances box (clamped at max), miss resets to
-- box 1 and counts a lapse. No day counts in the body — read from the schedule.
-- Early guard + single atomic UPDATE (no separate current-box read).
CREATE OR REPLACE FUNCTION record_review_result(
  p_user_id  UUID,
  p_item_key TEXT,
  p_passed   BOOLEAN
) RETURNS TABLE (box SMALLINT, due_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_max_box SMALLINT;
BEGIN
  -- Early guard: nothing to grade if the learner has no such item.
  IF NOT EXISTS (
    SELECT 1 FROM public.review_items ri
    WHERE ri.user_id = p_user_id AND ri.item_key = p_item_key
  ) THEN
    RETURN;
  END IF;

  SELECT max(rs.box) INTO v_max_box FROM public.review_schedule rs;

  -- Atomic read-modify-write: the new box is derived from the row's OWN box
  -- inside the UPDATE (no separate SELECT of the current box), so two
  -- concurrent grades cannot double-read a stale value. review_schedule is
  -- joined for the new box's interval in the same statement — no day counts.
  UPDATE public.review_items ri
     SET box              = CASE WHEN p_passed THEN LEAST(ri.box + 1, v_max_box) ELSE 1 END,
         due_at           = now() + make_interval(days => sched.interval_days),
         last_result      = p_passed,
         last_reviewed_at = now(),
         lapses           = ri.lapses + CASE WHEN p_passed THEN 0 ELSE 1 END,
         updated_at       = now()
    FROM public.review_schedule sched
   WHERE ri.user_id = p_user_id AND ri.item_key = p_item_key
     AND sched.box = CASE WHEN p_passed THEN LEAST(ri.box + 1, v_max_box) ELSE 1 END;

  RETURN QUERY
    SELECT ri.box, ri.due_at
    FROM public.review_items ri
    WHERE ri.user_id = p_user_id AND ri.item_key = p_item_key;
END;
$$;

REVOKE ALL ON FUNCTION record_review_result(UUID, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_review_result(UUID, TEXT, BOOLEAN) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- AI tutor spend ledger (#591): the AI Partner spends a Superteam-sponsored
-- Gemini key. challenge_assists counts TURNS, not spend. ai_spend_ledger records
-- actual micro-USD (USD × 1e6, integer money) per billed generation in three
-- daily buckets on America/Sao_Paulo days (AIE-21): account, ip, and a global
-- envelope backstop. The route reads the totals via check_ai_spend BEFORE the
-- model call (under soft → full; over soft → degrade; over hard → deny) and
-- records usage via record_ai_spend AFTER it bills us. Thresholds live in env
-- (TS), not here, so caps move with the sponsor commitment (O-1, $500/mo). All
-- RPCs follow the challenge_assists hardening: SECURITY DEFINER, pinned path,
-- RLS-on table with no policies, REVOKEd from clients, GRANTed to service_role.
-- The TS wrapper fails CLOSED (any check error → deny), never open.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_spend_ledger (
  scope         TEXT NOT NULL,
  scope_key     TEXT NOT NULL,
  spend_day     DATE NOT NULL,
  micro_usd     BIGINT NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, scope_key, spend_day),
  CONSTRAINT ai_spend_ledger_scope_check CHECK (scope IN ('account', 'ip', 'global'))
);

ALTER TABLE ai_spend_ledger ENABLE ROW LEVEL SECURITY;
-- No policies: reached only through SECURITY DEFINER RPCs called by service_role.

-- Add p_micro_usd to all three of today's buckets in one upsert. Negative input
-- is clamped to 0. The SP-day is computed here so callers never pass a clock.
CREATE OR REPLACE FUNCTION record_ai_spend(
  p_user_id   UUID,
  p_ip        TEXT,
  p_micro_usd BIGINT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_day    DATE   := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_amount BIGINT := GREATEST(COALESCE(p_micro_usd, 0), 0);
  v_ip     TEXT   := COALESCE(NULLIF(p_ip, ''), 'unknown');
BEGIN
  INSERT INTO public.ai_spend_ledger (scope, scope_key, spend_day, micro_usd, request_count, updated_at)
  VALUES
    ('account', p_user_id::text, v_day, v_amount, 1, now()),
    ('ip',      v_ip,            v_day, v_amount, 1, now()),
    ('global',  '',              v_day, v_amount, 1, now())
  ON CONFLICT (scope, scope_key, spend_day)
  DO UPDATE SET
    micro_usd     = public.ai_spend_ledger.micro_usd + EXCLUDED.micro_usd,
    request_count = public.ai_spend_ledger.request_count + 1,
    updated_at    = now();
END;
$$;

REVOKE ALL ON FUNCTION record_ai_spend(UUID, TEXT, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_ai_spend(UUID, TEXT, BIGINT) TO service_role;

-- Read today's accumulated micro-USD for account, IP, and global. The route
-- compares these to the env thresholds to pick full/degrade/deny.
CREATE OR REPLACE FUNCTION check_ai_spend(
  p_user_id UUID,
  p_ip      TEXT
) RETURNS TABLE (account_micro_usd BIGINT, ip_micro_usd BIGINT, global_micro_usd BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE((SELECT micro_usd FROM public.ai_spend_ledger
      WHERE scope = 'account' AND scope_key = p_user_id::text
        AND spend_day = (now() AT TIME ZONE 'America/Sao_Paulo')::date), 0),
    COALESCE((SELECT micro_usd FROM public.ai_spend_ledger
      WHERE scope = 'ip' AND scope_key = COALESCE(NULLIF(p_ip, ''), 'unknown')
        AND spend_day = (now() AT TIME ZONE 'America/Sao_Paulo')::date), 0),
    COALESCE((SELECT micro_usd FROM public.ai_spend_ledger
      WHERE scope = 'global' AND scope_key = ''
        AND spend_day = (now() AT TIME ZONE 'America/Sao_Paulo')::date), 0);
$$;

REVOKE ALL ON FUNCTION check_ai_spend(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_ai_spend(UUID, TEXT) TO service_role;

-- Admin observability: the global burn for the current SP day.
CREATE OR REPLACE FUNCTION get_ai_spend_today()
RETURNS TABLE (micro_usd BIGINT, request_count INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE(l.micro_usd, 0),
    COALESCE(l.request_count, 0)
  FROM (SELECT 1) AS one
  LEFT JOIN public.ai_spend_ledger l
    ON l.scope = 'global' AND l.scope_key = ''
   AND l.spend_day = (now() AT TIME ZONE 'America/Sao_Paulo')::date;
$$;

REVOKE ALL ON FUNCTION get_ai_spend_today() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ai_spend_today() TO service_role;

-- ============================================================================
-- course_changelog (#654) — post-deployment course evolution log.
-- Mirror of supabase/migrations/20260726210000_course_changelog.sql. See that
-- file's header for the full rationale. Server-side capture at mutation time
-- (the admin sync route, service_role); learner-visible public read.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.course_changelog (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id    TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN (
                 'deployed',
                 'lessons_added',
                 'lessons_removed',
                 'xp_changed',
                 'content_updated',
                 'deactivated',
                 'reactivated',
                 'recreated'
               )),
  version      INTEGER NOT NULL,
  detail       JSONB NOT NULL DEFAULT '{}'::jsonb,
  tx_signature TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_changelog_dedup UNIQUE (course_id, kind, tx_signature)
);

CREATE INDEX IF NOT EXISTS idx_course_changelog_course_created
  ON public.course_changelog (course_id, created_at DESC);

ALTER TABLE public.course_changelog ENABLE ROW LEVEL SECURITY;

-- Fail-closed public read: visible only for a synced+active course (the catalog
-- gate, isSynced). EXISTS runs against the anon-readable public_onchain_deployments
-- view, defined by 20260711120000_onchain_deployments.sql.
DROP POLICY IF EXISTS "Course changelog is viewable by everyone" ON public.course_changelog;
DROP POLICY IF EXISTS "Course changelog visible for synced-active courses" ON public.course_changelog;
CREATE POLICY "Course changelog visible for synced-active courses"
  ON public.course_changelog FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.public_onchain_deployments d
      WHERE d.content_id = course_changelog.course_id
        AND d.kind = 'course'
        AND d.status = 'synced'
        AND COALESCE(d.is_active, true)
    )
  );
-- NO write policy: service_role-only writes (bypasses RLS) from the admin sync route.

-- ─────────────────────────────────────────────────────────────────────────
-- Cohort leagues (LX-B9b, #574): weekly small-cohort leagues + you-±3 strip,
-- replacing the "poisoned by design" global-absolute board. DISPLAY-ONLY — no
-- reward contingency (PED-10/14, UIU-09); score is derived from XP already
-- earned, filtered to learning sources (is_league_eligible_source, the LX-B9a
-- source column) so creator/community/platform XP never becomes competitive
-- currency. LAZY on-first-read assignment (D-4 undecided → no scheduler; the
-- get_daily_quest_state precedent). SNAPSHOT scoring: league_members.score is
-- materialized and recomputed for a whole cohort in one throttled pass
-- (refresh_cohort_scores) — the read RPCs never SUM xp_transactions per call.
-- RLS: league_tiers public-read reference data; cohorts have NO policy (RPC-only
-- exposure); members own-row SELECT only. Read RPCs are SECURITY DEFINER,
-- project only public_profiles columns, and anonymize (never drop) private
-- members. Mirror of 20260726200000_cohort_leagues.sql.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_league_eligible_source(p_source TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_source IN ('lesson', 'course_completion', 'quest', 'achievement')
$$;

REVOKE EXECUTE ON FUNCTION public.is_league_eligible_source(TEXT)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.league_week_start(p_date DATE)
RETURNS DATE
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (date_trunc('week', p_date::timestamp))::date
$$;

REVOKE EXECUTE ON FUNCTION public.league_week_start(DATE)
  FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS league_tiers (
  tier              SMALLINT PRIMARY KEY,
  min_prior_week_xp INTEGER  NOT NULL CHECK (min_prior_week_xp >= 0),
  UNIQUE (min_prior_week_xp)
);

ALTER TABLE league_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "League tiers are viewable by everyone" ON league_tiers;
CREATE POLICY "League tiers are viewable by everyone"
  ON league_tiers FOR SELECT USING (true);

INSERT INTO league_tiers (tier, min_prior_week_xp) VALUES
  (1, 0),
  (2, 100),
  (3, 500),
  (4, 2000)
ON CONFLICT (tier) DO NOTHING;

CREATE TABLE IF NOT EXISTS league_cohorts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start          DATE     NOT NULL,
  tier                SMALLINT NOT NULL REFERENCES league_tiers(tier),
  member_count        INTEGER  NOT NULL DEFAULT 0 CHECK (member_count >= 0),
  scores_refreshed_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_league_cohorts_week_tier
  ON league_cohorts (week_start, tier, created_at DESC);

ALTER TABLE league_cohorts ENABLE ROW LEVEL SECURITY;
-- NO policy: cohorts are exposed only through the SECURITY DEFINER read RPCs.

CREATE TABLE IF NOT EXISTS league_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id  UUID NOT NULL REFERENCES league_cohorts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  score      BIGINT NOT NULL DEFAULT 0 CHECK (score >= 0),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_league_members_cohort_score
  ON league_members (cohort_id, score DESC);

ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own league membership" ON league_members;
CREATE POLICY "Users can view their own league membership"
  ON league_members FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE/DELETE policy: writes go through the SECURITY DEFINER RPCs.

CREATE OR REPLACE FUNCTION public.ensure_league_membership(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  LEAGUE_COHORT_CAPACITY CONSTANT INTEGER := 30;
  v_week_start      DATE;
  v_prior_start     DATE;
  v_prior_xp        BIGINT;
  v_tier            SMALLINT;
  v_cohort_id       UUID;
  v_inserted_cohort UUID;
BEGIN
  v_week_start  := public.league_week_start(CURRENT_DATE);

  SELECT cohort_id INTO v_cohort_id
  FROM public.league_members
  WHERE user_id = p_user_id AND week_start = v_week_start;
  IF FOUND THEN
    RETURN v_cohort_id;
  END IF;

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
  IF v_tier IS NULL THEN
    SELECT MIN(t.tier) INTO v_tier FROM public.league_tiers t;
  END IF;

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

  SELECT cohort_id INTO v_cohort_id
  FROM public.league_members
  WHERE user_id = p_user_id AND week_start = v_week_start;
  RETURN v_cohort_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_league_membership(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_league_membership(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.refresh_cohort_scores(p_cohort_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
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
-- VOLATILE (default): assigns membership + refreshes the snapshot on read.
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
    -- Anonymized non-you rows expose no id; the caller always sees their own.
    CASE WHEN pp.id IS NULL AND m.user_id <> p_user_id THEN NULL ELSE m.user_id END,
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
-- The "you ±3" strip window is derived in the API layer (cohortStripWindow) over
-- this board's snapshot rows — no second per-call SUM, no SQL⇄TS duplication.

-- ============================================================================
-- email_subscriptions (#769) — marketing-email consent model.
-- Mirror of supabase/migrations/20260728120000_email_subscriptions.sql. See that
-- file's header for the full rationale. Opt-out by default; own-row read; writes
-- via SECURITY DEFINER RPCs (self-service toggle, pipeline read, one-click
-- unsubscribe).
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_subscriptions (
  user_id           UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  opt_in            BOOLEAN NOT NULL DEFAULT false,
  consent_at        TIMESTAMPTZ,
  unsubscribed_at   TIMESTAMPTZ,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Session-plan reminder consent (#869) — a SEPARATE consent type with its own
  -- opt-in flag and its own LGPD timestamps. Never inferred from `opt_in`.
  -- Mirror of 20260731120000_reminder_consent.sql.
  reminder_opt_in          BOOLEAN NOT NULL DEFAULT false,
  reminder_consent_at      TIMESTAMPTZ,
  reminder_unsubscribed_at TIMESTAMPTZ,
  reminder_locale          TEXT,
  -- KIND-SCOPED unsubscribe secret (#896). Marketing and reminder consent used
  -- to SHARE `unsubscribe_token`, so the caller-supplied `kind` decided which
  -- consent a token revoked (cross-kind flip). Each kind now has its OWN secret
  -- and each unsubscribe RPC matches only its own column. Mirror of
  -- 20260731150000_kind_scoped_unsubscribe.sql.
  reminder_unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT email_subscriptions_token_unique UNIQUE (unsubscribe_token),
  CONSTRAINT email_subscriptions_reminder_token_unique UNIQUE (reminder_unsubscribe_token),
  -- The two consents must NEVER share a secret — a table invariant, so no future
  -- backfill or restore can quietly re-merge them (#896).
  CONSTRAINT chk_email_subscriptions_distinct_tokens
    CHECK (reminder_unsubscribe_token <> unsubscribe_token),
  CONSTRAINT chk_email_subscriptions_reminder_locale
    CHECK (reminder_locale IS NULL OR reminder_locale IN ('en', 'pt-BR', 'es'))
);

CREATE INDEX IF NOT EXISTS idx_email_subscriptions_opt_in
  ON email_subscriptions (opt_in) WHERE opt_in = true;

CREATE INDEX IF NOT EXISTS idx_email_subscriptions_reminder_opt_in
  ON email_subscriptions (reminder_opt_in) WHERE reminder_opt_in = true;

ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own email subscription" ON email_subscriptions;
CREATE POLICY "Users can view their own email subscription"
  ON email_subscriptions FOR SELECT USING (auth.uid() = user_id);
-- NO write policy: writes only via the SECURITY DEFINER RPCs below.

CREATE OR REPLACE FUNCTION set_marketing_opt_in(p_opt_in BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.email_subscriptions (user_id, opt_in, consent_at, unsubscribed_at, updated_at)
  VALUES (
    v_uid,
    p_opt_in,
    CASE WHEN p_opt_in THEN now() ELSE NULL END,
    CASE WHEN p_opt_in THEN NULL ELSE now() END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    opt_in          = EXCLUDED.opt_in,
    consent_at      = CASE WHEN EXCLUDED.opt_in THEN now() ELSE public.email_subscriptions.consent_at END,
    unsubscribed_at = CASE WHEN EXCLUDED.opt_in THEN public.email_subscriptions.unsubscribed_at ELSE now() END,
    updated_at      = now();
END;
$$;

REVOKE ALL ON FUNCTION set_marketing_opt_in(BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_marketing_opt_in(BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION list_marketing_recipients()
RETURNS TABLE (user_id UUID, email TEXT, unsubscribe_token UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT es.user_id, u.email::text, es.unsubscribe_token
  FROM public.email_subscriptions es
  JOIN auth.users u ON u.id = es.user_id
  WHERE es.opt_in = true
    AND u.email IS NOT NULL
    AND u.email <> ''
    -- Exclude synthetic wallet-auth placeholders (`<pubkey>@wallet.superteam-lms.local`,
    -- see apps/web/src/app/api/auth/wallet/route.ts): a real-looking but
    -- undeliverable address that must never receive mail.
    AND u.email NOT LIKE '%@wallet.superteam-lms.local'
  ORDER BY es.user_id;
$$;

REVOKE ALL ON FUNCTION list_marketing_recipients() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION list_marketing_recipients() TO service_role;

CREATE OR REPLACE FUNCTION unsubscribe_by_token(p_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- Row count from GET DIAGNOSTICS is an integer, so v_matched must be INTEGER —
  -- a BOOLEAN here makes `RETURN v_matched > 0` raise "operator does not exist:
  -- boolean > integer" on every call, breaking one-click unsubscribe.
  v_matched INTEGER;
BEGIN
  UPDATE public.email_subscriptions
  SET opt_in = false, unsubscribed_at = now(), updated_at = now()
  -- #896: the MARKETING secret ONLY. Grandfathered — every marketing link ever
  -- minted carries this value and keeps working. A reminder token lives in the
  -- other column and can never match here.
  WHERE unsubscribe_token = p_token;
  GET DIAGNOSTICS v_matched = ROW_COUNT;
  RETURN v_matched > 0;
END;
$$;

REVOKE ALL ON FUNCTION unsubscribe_by_token(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION unsubscribe_by_token(UUID) TO service_role;

-- ============================================================================
-- Session-plan reminder consent + send ledger (#869).
-- Mirror of supabase/migrations/20260731120000_reminder_consent.sql. See that
-- file's header for the full rationale. Reminder consent is a SEPARATE consent
-- type from marketing consent (columns above); the ledger below makes "one
-- reminder per learner per Sao Paulo day" a database invariant.
-- ============================================================================

-- ── 2. email_reminder_log — per (user, kind, day) send ledger ────────────────
CREATE TABLE IF NOT EXISTS email_reminder_log (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Reminder family. Extensible (streak nudges, re-engagement) without a new
  -- ledger; each family gets its own once-per-day slot.
  kind    TEXT NOT NULL,
  -- America/Sao_Paulo calendar day the reminder was claimed for.
  sent_on DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, sent_on),
  -- Widened by #899 to take the two re-engagement families. Mirror of
  -- 20260731170000_reengagement_pipeline.sql.
  CONSTRAINT chk_email_reminder_log_kind
    CHECK (kind IN ('session_plan', 'reengagement_7d', 'course_nudge'))
);

-- The re-engagement frequency cap probes recent rows per learner over a SET of
-- kinds and a date RANGE (#899).
CREATE INDEX IF NOT EXISTS idx_email_reminder_log_user_sent_on
  ON email_reminder_log (user_id, sent_on DESC);

-- Service-role-only bookkeeping: RLS on, NO policies ⇒ anon/authenticated are
-- denied every operation. service_role bypasses RLS and is the only writer.
ALTER TABLE email_reminder_log ENABLE ROW LEVEL SECURITY;

-- ── 3. set_reminder_opt_in — self-service toggle (authenticated) ─────────────
-- Upserts ONLY the reminder columns of the caller's row, stamping the timestamp
-- server-side. Keyed on auth.uid(): a caller can only change their OWN consent.
-- Marketing consent on the same row is left completely untouched.
CREATE OR REPLACE FUNCTION set_reminder_opt_in(p_opt_in BOOLEAN, p_locale TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  -- Reject an unknown locale rather than store it: the CHECK would abort the
  -- whole toggle, and a bad locale is not worth failing a consent write over.
  v_locale TEXT := CASE WHEN p_locale IN ('en', 'pt-BR', 'es') THEN p_locale ELSE NULL END;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.email_subscriptions (
    user_id, reminder_opt_in, reminder_consent_at, reminder_unsubscribed_at,
    reminder_locale, updated_at
  )
  VALUES (
    v_uid,
    p_opt_in,
    CASE WHEN p_opt_in THEN now() ELSE NULL END,
    CASE WHEN p_opt_in THEN NULL ELSE now() END,
    v_locale,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    reminder_opt_in          = EXCLUDED.reminder_opt_in,
    -- A re-opt-in is FRESH consent (mirrors set_marketing_opt_in).
    reminder_consent_at      = CASE WHEN EXCLUDED.reminder_opt_in
                                    THEN now()
                                    ELSE public.email_subscriptions.reminder_consent_at END,
    reminder_unsubscribed_at = CASE WHEN EXCLUDED.reminder_opt_in
                                    THEN public.email_subscriptions.reminder_unsubscribed_at
                                    ELSE now() END,
    -- Keep the last known locale when the caller passes none.
    reminder_locale          = COALESCE(EXCLUDED.reminder_locale, public.email_subscriptions.reminder_locale),
    updated_at               = now();
END;
$$;

REVOKE ALL ON FUNCTION set_reminder_opt_in(BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_reminder_opt_in(BOOLEAN, TEXT) TO authenticated;

-- ── 4. claim_due_session_reminders — atomic claim + recipient read ───────────
-- THE consent gate AND the idempotency gate in one statement. Returns a learner
-- iff ALL of these hold:
--   * reminder_opt_in = true                      (explicit consent for THIS purpose)
--   * a real email on file                        (never a wallet-auth placeholder)
--   * today's São Paulo weekday is a member of `prefs.nextLesson.days` — the
--     committed plan list (up to all seven = daily). The pre-#582-successor
--     single `day` string is gone: 20260804120000_recurring_lesson_plan.sql
--     converted every stored one to a one-element `days` array.
--   * no email_reminder_log row for (user, 'session_plan', today) — and the claim
--     row is INSERTed in the same statement, so a concurrent/second run gets
--     nothing back.
-- p_weekday overrides today's weekday (service_role only; used by tests and by a
-- manual catch-up run).
CREATE OR REPLACE FUNCTION claim_due_session_reminders(p_weekday TEXT DEFAULT NULL)
RETURNS TABLE (user_id UUID, email TEXT, unsubscribe_token UUID, locale TEXT, plan_time TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_column
DECLARE
  v_today   DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  -- to_char(..., 'dy') is the lowercase English abbreviation (mon…sun) — exactly
  -- the token the plan picker stores in every element of prefs.nextLesson.days.
  -- No TM prefix, so it is NOT affected by the server's lc_time.
  v_weekday TEXT := COALESCE(
    p_weekday,
    trim(to_char((now() AT TIME ZONE 'America/Sao_Paulo'), 'dy'))
  );
BEGIN
  RETURN QUERY
  WITH due AS (
    SELECT
      es.user_id                                     AS uid,
      u.email::text                                  AS mail,
      -- #896: the reminder-scoped secret. A reminder email must never carry the
      -- marketing token (the OUT column keeps its name — signature unchanged).
      es.reminder_unsubscribe_token                  AS tok,
      es.reminder_locale                             AS loc,
      COALESCE(p.prefs -> 'nextLesson' ->> 'time', '') AS ptime
    FROM public.email_subscriptions es
    JOIN auth.users u ON u.id = es.user_id
    JOIN public.profiles p ON p.id = es.user_id
    -- #1075: consent is asserted HERE, at claim time — the claim and the ledger
    -- INSERT are one statement, so a flip between the learner scheduling and
    -- the cron claiming excludes the row.
    WHERE es.reminder_opt_in = true
      AND u.email IS NOT NULL
      AND u.email <> ''
      -- Synthetic wallet-auth addresses are not inboxes (see #779). lower():
      -- SQL mirror of isWalletPlaceholderEmail (#1074,
      -- apps/web/src/lib/auth/wallet-placeholder.ts) — a differently-cased
      -- placeholder must not slip past a byte-wise LIKE. Keep the two in step.
      AND lower(u.email) NOT LIKE '%@wallet.superteam-lms.local'
      -- Multi-day plans: membership of the committed `days` list
      -- (`jsonb ? text` = element exists). All seven entries = daily. The claim
      -- below still caps a learner at ONE reminder per São Paulo day.
      AND (p.prefs -> 'nextLesson' -> 'days') ? v_weekday
  ),
  claimed AS (
    INSERT INTO public.email_reminder_log (user_id, kind, sent_on)
    SELECT due.uid, 'session_plan', v_today FROM due
    ON CONFLICT (user_id, kind, sent_on) DO NOTHING
    RETURNING email_reminder_log.user_id AS uid
  )
  SELECT d.uid, d.mail, d.tok, d.loc, d.ptime
  FROM due d
  JOIN claimed c ON c.uid = d.uid
  -- Deterministic order so the pipeline's chunk boundaries (and therefore its
  -- Resend idempotency keys) are reproducible across a retry — same reasoning as
  -- list_marketing_recipients.
  ORDER BY d.uid;
END;
$$;

REVOKE ALL ON FUNCTION claim_due_session_reminders(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_due_session_reminders(TEXT) TO service_role;

-- ── 5. release_session_reminder_claims — undo a failed batch (service_role) ──
-- Deletes TODAY's claim rows for the given users so a failed send can be retried
-- within the same day. Only ever removes rows the pipeline itself just wrote.
CREATE OR REPLACE FUNCTION release_session_reminder_claims(p_user_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today   DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.email_reminder_log
  WHERE kind = 'session_plan'
    AND sent_on = v_today
    AND user_id = ANY(p_user_ids);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION release_session_reminder_claims(UUID[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION release_session_reminder_claims(UUID[]) TO service_role;

-- ── 6. unsubscribe_reminders_by_token — one-click (service_role) ─────────────
-- Clears REMINDER consent for the row owning `p_token`, with no session. Leaves
-- marketing consent untouched: unsubscribing from study reminders must not also
-- silently cancel product news (and vice versa). Idempotent.
CREATE OR REPLACE FUNCTION unsubscribe_reminders_by_token(p_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- INTEGER, not BOOLEAN: GET DIAGNOSTICS yields a row count (#779's bug).
  v_matched INTEGER;
BEGIN
  UPDATE public.email_subscriptions
  SET reminder_opt_in = false,
      reminder_unsubscribed_at = now(),
      updated_at = now()
  -- #896: the REMINDER secret, not the shared one. Do NOT add an OR on
  -- `unsubscribe_token` "for old links" — that is the vulnerability.
  WHERE reminder_unsubscribe_token = p_token;
  GET DIAGNOSTICS v_matched = ROW_COUNT;
  RETURN v_matched > 0;
END;
$$;

REVOKE ALL ON FUNCTION unsubscribe_reminders_by_token(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION unsubscribe_reminders_by_token(UUID) TO service_role;


-- ============================================================================
-- RE-ENGAGEMENT SEND PIPELINE (#899)
-- Mirror of supabase/migrations/20260731170000_reengagement_pipeline.sql. The
-- ledger CHECK widening and the ledger index are mirrored at the
-- `email_reminder_log` definition above.
--
-- The frequency cap (at most one re-engagement-class email per learner per N
-- days, ACROSS both kinds) lives INSIDE the claim RPC, so it is a database
-- invariant rather than an app convention. `session_plan` is deliberately NOT
-- in the capped set: a self-scheduled session reminder neither consumes the
-- re-engagement budget nor is suppressed by it.
-- ============================================================================

-- Supporting indexes for the last-activity and lessons-remaining clauses.
CREATE INDEX IF NOT EXISTS idx_user_progress_user_completed_at
  ON user_progress (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_course_completed
  ON user_progress (user_id, course_id) WHERE completed;

-- ── 3. claim_due_reengagement — atomic claim + cap + recipient read ─────────
-- Returns a learner iff ALL of these hold:
--   * reminder_opt_in = true          (REMINDER consent — never the marketing
--                                      opt-in; LGPD consent is purpose-bound)
--   * a real email on file            (never a wallet-auth placeholder)
--   * last seen ≥ p_inactive_days ago (see the header's signal enumeration)
--   * NO re-engagement-kind row in the last p_cap_days   ← THE FREQUENCY CAP
--   * for 'course_nudge': an enrolled, uncertified, incomplete course with
--     between 1 and p_max_remaining lessons left
--   * no row for (user, p_kind, today) — and the claim row is INSERTed in the
--     SAME statement, so a concurrent run gets nothing back.
--
-- `completed_lesson_ids` is returned for the course-nudge kind so the caller can
-- resolve the next incomplete lesson against the content bundle
-- (`findNextIncompleteLesson`) without an N+1 read per recipient. It is empty
-- for the generic kind, whose CTA is the dashboard.
CREATE OR REPLACE FUNCTION claim_due_reengagement(
  p_kind          TEXT,
  p_inactive_days INTEGER DEFAULT 7,
  p_cap_days      INTEGER DEFAULT 14,
  p_max_remaining INTEGER DEFAULT 1,
  p_course_totals JSONB   DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  user_id              UUID,
  email                TEXT,
  unsubscribe_token    UUID,
  locale               TEXT,
  streak_days          INTEGER,
  days_inactive        INTEGER,
  course_id            TEXT,
  completed_lesson_ids TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_column
DECLARE
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  -- Kinds that CONSUME and are BLOCKED BY the cap. 'session_plan' is absent on
  -- purpose — see the header. One place to widen if the policy ever changes.
  v_capped_kinds TEXT[] := ARRAY['reengagement_7d', 'course_nudge'];
BEGIN
  -- Reject anything outside the re-engagement family, so this RPC can never be
  -- used to mint (or, via the release twin, delete) a session_plan ledger row.
  IF p_kind IS NULL OR NOT (p_kind = ANY(v_capped_kinds)) THEN
    RAISE EXCEPTION 'unsupported re-engagement kind: %', p_kind;
  END IF;
  -- A zero/negative window would make the gate vacuous — fail loudly rather
  -- than quietly nudge everyone daily.
  IF p_inactive_days IS NULL OR p_inactive_days < 1 THEN
    RAISE EXCEPTION 'p_inactive_days must be >= 1';
  END IF;
  IF p_cap_days IS NULL OR p_cap_days < 1 THEN
    RAISE EXCEPTION 'p_cap_days must be >= 1';
  END IF;
  IF p_max_remaining IS NULL OR p_max_remaining < 1 THEN
    RAISE EXCEPTION 'p_max_remaining must be >= 1';
  END IF;

  -- Serialise re-engagement claims so the CROSS-KIND cap holds under
  -- concurrency (see the header). Transaction-scoped: released on commit.
  --
  -- ISOLATION-LEVEL CAVEAT (gate F2, informational). This is correct under READ
  -- COMMITTED — the default, and what PostgREST/Supabase uses: the RETURN QUERY
  -- below takes a FRESH snapshot after the lock is granted, so it sees the rows
  -- the previous holder committed. Under REPEATABLE READ (or SERIALIZABLE) the
  -- snapshot is fixed at the transaction's first statement, i.e. BEFORE the lock
  -- is acquired, so a waiter would read a pre-lock view of email_reminder_log and
  -- the cap could be evaluated against stale rows. Re-evaluate this lock (and
  -- prefer a serialization-failure retry) if this function is ever called on a
  -- connection that raises the isolation level.

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('claim_due_reengagement')
  );

  RETURN QUERY
  WITH consenting AS (
    SELECT
      es.user_id                        AS uid,
      u.email::text                     AS mail,
      -- #896: the REMINDER-scoped secret. Re-engagement rides on reminder
      -- consent, so it must never carry the marketing token.
      es.reminder_unsubscribe_token     AS tok,
      es.reminder_locale                AS loc,
      COALESCE(ux.longest_streak, 0)::int AS streak,
      GREATEST(
        ux.last_activity_date,
        (SELECT max(up.completed_at)
           FROM public.user_progress up
          WHERE up.user_id = es.user_id AND up.completed)::date,
        (SELECT max(e.enrolled_at)
           FROM public.enrollments e
          WHERE e.user_id = es.user_id)::date,
        p.created_at::date
      ) AS last_seen
    FROM public.email_subscriptions es
    JOIN auth.users u      ON u.id = es.user_id
    JOIN public.profiles p ON p.id = es.user_id
    LEFT JOIN public.user_xp ux ON ux.user_id = es.user_id
    -- #1075: consent is asserted HERE, at claim time — the claim and the ledger
    -- INSERT are one statement, so a flip between the learner becoming due and
    -- the cron claiming excludes the row.
    WHERE es.reminder_opt_in = true
      AND u.email IS NOT NULL
      AND u.email <> ''
      -- Synthetic wallet-auth addresses are not inboxes (see #779). lower():
      -- SQL mirror of isWalletPlaceholderEmail (#1074,
      -- apps/web/src/lib/auth/wallet-placeholder.ts) — a differently-cased
      -- placeholder must not slip past a byte-wise LIKE. Keep the two in step.
      AND lower(u.email) NOT LIKE '%@wallet.superteam-lms.local'
  ),
  lapsed AS (
    SELECT c.*, (v_today - c.last_seen)::int AS inactive_days
    FROM consenting c
    WHERE c.last_seen IS NOT NULL
      AND c.last_seen <= v_today - p_inactive_days
      -- THE FREQUENCY CAP. `sent_on > v_today - p_cap_days` is a half-open
      -- window that INCLUDES today, so the row a sibling pass wrote minutes ago
      -- blocks this one, and tomorrow's run is blocked by today's row.
      AND NOT EXISTS (
        SELECT 1 FROM public.email_reminder_log l
        WHERE l.user_id = c.uid
          AND l.kind = ANY(v_capped_kinds)
          AND l.sent_on > v_today - p_cap_days
      )
  ),
  -- Nearest-to-done enrolled course per lapsed learner. DISTINCT ON keeps one
  -- course per learner, deterministically (fewest remaining, then course id).
  nearly AS (
    SELECT DISTINCT ON (e.user_id)
      e.user_id   AS uid,
      e.course_id AS cid
    FROM public.enrollments e
    JOIN lapsed l ON l.uid = e.user_id
    CROSS JOIN LATERAL (
      SELECT (p_course_totals ->> e.course_id)::int AS total
    ) t
    LEFT JOIN LATERAL (
      SELECT count(*)::int AS done
      FROM public.user_progress up
      WHERE up.user_id = e.user_id
        AND up.course_id = e.course_id
        AND up.completed
    ) pr ON true
    WHERE p_kind = 'course_nudge'
      -- A course the bundle does not list (unsynced/retired) is never nudged.
      AND t.total IS NOT NULL
      AND e.completed_at IS NULL
      -- Already credentialed ⇒ nothing to finish.
      AND NOT EXISTS (
        SELECT 1 FROM public.certificates ct
        WHERE ct.user_id = e.user_id AND ct.course_id = e.course_id
      )
      AND (t.total - COALESCE(pr.done, 0)) BETWEEN 1 AND p_max_remaining
    ORDER BY e.user_id, (t.total - COALESCE(pr.done, 0)), e.course_id
  ),
  due AS (
    -- course_nudge: only learners with a nearly-done course, carrying it.
    SELECT
      l.uid, l.mail, l.tok, l.loc, l.streak, l.inactive_days,
      n.cid AS cid,
      COALESCE(
        (SELECT array_agg(up.lesson_id ORDER BY up.lesson_id)
           FROM public.user_progress up
          WHERE up.user_id = l.uid
            AND up.course_id = n.cid
            AND up.completed),
        ARRAY[]::text[]
      ) AS done_ids
    FROM lapsed l
    JOIN nearly n ON n.uid = l.uid
    WHERE p_kind = 'course_nudge'
    UNION ALL
    -- reengagement_7d: no course context AT ALL. Not merely unused — returning
    -- one would let the caller render a course nudge under the generic ledger
    -- kind, breaking the template→return instrumentation.
    SELECT
      l.uid, l.mail, l.tok, l.loc, l.streak, l.inactive_days,
      NULL::text, ARRAY[]::text[]
    FROM lapsed l
    WHERE p_kind = 'reengagement_7d'
  ),
  claimed AS (
    INSERT INTO public.email_reminder_log (user_id, kind, sent_on)
    SELECT due.uid, p_kind, v_today FROM due
    ON CONFLICT (user_id, kind, sent_on) DO NOTHING
    RETURNING email_reminder_log.user_id AS uid
  )
  SELECT d.uid, d.mail, d.tok, d.loc, d.streak, d.inactive_days, d.cid, d.done_ids
  FROM due d
  JOIN claimed c ON c.uid = d.uid
  -- Deterministic order so the pipeline's chunk boundaries — and therefore its
  -- Resend idempotency keys — are reproducible across a retry.
  ORDER BY d.uid;
END;
$$;

REVOKE ALL ON FUNCTION claim_due_reengagement(TEXT, INTEGER, INTEGER, INTEGER, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_due_reengagement(TEXT, INTEGER, INTEGER, INTEGER, JSONB)
  TO service_role;

-- ── 4. release_reengagement_claims — undo a failed batch (service_role) ─────
-- Deletes TODAY's claim rows of ONE re-engagement kind for the given users, so a
-- send that PROVABLY never left the building can be retried. Restricted to the
-- re-engagement kinds: a session-plan claim is not this pipeline's to release.
CREATE OR REPLACE FUNCTION release_reengagement_claims(
  p_kind     TEXT,
  p_user_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today   DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_deleted INTEGER;
BEGIN
  IF p_kind IS NULL OR p_kind NOT IN ('reengagement_7d', 'course_nudge') THEN
    RAISE EXCEPTION 'unsupported re-engagement kind: %', p_kind;
  END IF;

  DELETE FROM public.email_reminder_log
  WHERE kind = p_kind
    AND sent_on = v_today
    AND user_id = ANY(p_user_ids);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION release_reengagement_claims(TEXT, UUID[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION release_reengagement_claims(TEXT, UUID[]) TO service_role;


-- ─────────────────────────────────────────────
-- 21. REFERRAL PROGRAM (seasonal points + leaderboard)
-- ─────────────────────────────────────────────
-- Seasonal referral points: 1 for a referred signup, 1 per distinct course the
-- referred learner completes; standings per referral_seasons window (3-month
-- "seasons", top places rewarded). Point rules are DB invariants (partial
-- unique indexes on referral_events); profile referral columns are locked to
-- service_role by trg_enforce_referral_write (wallet write-lock pattern).
-- See migration 20260818150000_referral_program.sql for the full rationale.

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

-- ─────────────────────────────────────────────
-- PLATFORM STATS RPC (#1091)
-- ─────────────────────────────────────────────
-- Landing-page stats in one indexed call instead of a full public_user_xp scan
-- summed in JS plus two head counts. Same sources as the old three queries.
-- SECURITY DEFINER + service_role-only (mirrors get_leaderboard's pattern);
-- called exclusively from the server-rendered landing via createAdminClient().

CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE (total_xp BIGINT, builders BIGINT, credentials BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    (SELECT COALESCE(SUM(pux.total_xp), 0)::BIGINT FROM public.public_user_xp pux),
    (SELECT COUNT(*)::BIGINT FROM public.profiles),
    (SELECT COUNT(*)::BIGINT FROM public.certificates);
$$;

REVOKE EXECUTE ON FUNCTION public.get_platform_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_stats() TO service_role;
