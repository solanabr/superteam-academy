-- Account deletion (data-deletion request) — readiness G6, engineering half.
--
-- Soft-delete + anonymize model. We never hard-delete profile rows: on-chain XP
-- (Token-2022) and credential NFTs (Metaplex Core) are immutable and bound to the
-- learner's wallet, and DB history (xp_transactions, progress, certificates) is
-- referenced by those on-chain artifacts. Instead the user's own row is stamped
-- deleted and its PII scrubbed by POST /api/account/delete (service_role), while
-- the reads below stop surfacing soft-deleted profiles publicly.
--
-- Mirrors the soft-delete visibility pattern already used for threads/answers
-- (20260703150100_scope_soft_deleted_forum_visibility.sql): public SELECT paths
-- gain a `deleted_at IS NULL` guard; own-row access is untouched.

-- ─────────────────────────────────────────────
-- 1. COLUMNS
-- ─────────────────────────────────────────────
-- Both nullable, both NULL for every existing (non-deleted) row.
--   deleted_at            — when the anonymization was applied (tombstone).
--   deletion_requested_at — when the user asked for deletion (audit trail).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

-- Fast lookup of pending/soft-deleted accounts (admin review, GC jobs).
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
  ON profiles (deleted_at) WHERE deleted_at IS NOT NULL;

-- ─────────────────────────────────────────────
-- 2. PUBLIC-FACING READS EXCLUDE SOFT-DELETED PROFILES
-- ─────────────────────────────────────────────
-- The delete route also sets is_public = false, so the existing is_public gate
-- already hides a deleted profile. The `deleted_at IS NULL` guard below is
-- defense-in-depth: it keeps a soft-deleted account out of public reads even if
-- is_public were ever flipped back on, matching the threads/answers pattern.

-- profiles: public SELECT. Own-row SELECT ("Users can view their own profile",
-- auth.uid() = id) is a separate policy and is intentionally left intact so the
-- user can still load /settings after requesting deletion.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (is_public = true AND deleted_at IS NULL);

-- public_user_xp view (marketing stats, public profiles, community level badges).
-- The is_public join filter is the sole access guard for this owner-privilege
-- view; add the tombstone guard alongside it. Regrant to match the prior schema.
CREATE OR REPLACE VIEW public_user_xp AS
  SELECT ux.user_id, ux.total_xp, ux.level
  FROM user_xp ux
  JOIN profiles p ON p.id = ux.user_id
  WHERE p.is_public = true
    AND p.deleted_at IS NULL;

REVOKE ALL ON public_user_xp FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public_user_xp TO anon, authenticated;

-- get_leaderboard(): both the alltime and weekly/monthly branches join profiles
-- and already require is_public = true. Add deleted_at IS NULL so an anonymized
-- account (username scrubbed to a placeholder) can never appear on the board.
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
