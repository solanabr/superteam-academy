-- Tombstone guard for the three public surfaces that were missing it (#1120)
--
-- profiles.is_public is user-writable: the self-service RLS policies are
-- column-agnostic — `FOR UPDATE USING (auth.uid() = id)` says which ROW a
-- caller may write, never which COLUMNS. #1115 (20260819200000) locked
-- deleted_at to service_role, which killed the permanent resurrection in #1103
-- and left is_public as the one lever a tombstoned account can still pull.
--
-- 20260704140000_account_deletion.sql states the invariant this restores: every
-- public read path carries `deleted_at IS NULL` alongside `is_public = true`,
-- so that a soft-deleted account stays hidden "even if is_public were ever
-- flipped back on". Three objects were written without it, each for its own
-- reason:
--
--   community_stats           created 20260624181348_tighten_leaderboard_exposure
--                             — predates the deleted_at column entirely.
--   is_public_profile         created 20260726130000_route_public_profile_reads_
--                             through_view — its own header calls it "is this
--                             user a public, non-deleted profile?" while the
--                             body only ever checked is_public.
--   get_referral_leaderboard  created 20260818150000_referral_program — copied
--                             get_leaderboard's is_public/username hygiene
--                             filters but not its tombstone filter.
--
-- The guard belongs on the READ side rather than on the write, because it holds
-- for any writer and not just for the exploit. Concretely:
-- merge_wallet_shell_account() (20260817180000) tombstones the merged shell
-- with a bare `UPDATE public.profiles SET deleted_at = now()` and never touches
-- is_public — and profiles.is_public DEFAULTs to true — so merged shells are
-- already surfacing through these three objects today with no malicious write
-- anywhere. A write-side guard on is_public would not catch that; this does.
--
-- Reader-only change: no column and no security posture moves. ONE grant does
-- move, deliberately: community_stats currently carries Supabase's default
-- `arwdDxtm` for anon and authenticated, and the REVOKE below narrows that to
-- SELECT, matching public_profiles and public_onchain_deployments which were
-- already tightened. Inert either way — the view aggregates with GROUP BY, so
-- it is not auto-updatable and the write bits could never be exercised — but it
-- is a real privilege change on prod and belongs in the ledger, not glossed as
-- "no grants move". public_user_xp still carries the same default and is also
-- non-updatable; left alone here rather than widening this PR. Each body
-- below is carried forward verbatim from the latest migration that defines it
-- (named above) with the single filter added, and each object's existing grants
-- are re-stated explicitly rather than left to CREATE OR REPLACE's implicit
-- carry-forward.
--
-- Idempotent (CREATE OR REPLACE throughout). Deliberately NOT wrapped in an
-- explicit BEGIN/COMMIT: the Supabase CLI and MCP apply_migration each wrap the
-- file already, and a nested BEGIN/COMMIT inside MCP's transaction would commit
-- the outer one. A manual psql apply should use `psql -1`.

-- ─────────────────────────────────────────────
-- 1. is_public_profile — the predicate behind four public-read RLS policies
-- ─────────────────────────────────────────────
-- Gates the public-read policies on enrollments, user_progress,
-- user_achievements and certificates. Each of those tables also carries a
-- separate own-row SELECT policy, so a tombstoned user keeps full access to
-- their own data; only the cross-user path closes.
--
-- Unchanged: LANGUAGE sql, STABLE, SECURITY DEFINER, `SET search_path = ''`
-- (the body fully-qualifies public.profiles), and the REVOKE/GRANT pair below.
CREATE OR REPLACE FUNCTION public.is_public_profile(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND is_public = true AND deleted_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_public_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_profile(uuid) TO anon, authenticated;

-- ─────────────────────────────────────────────
-- 2. community_stats — owner-privilege aggregate view
-- ─────────────────────────────────────────────
-- The guard goes on the PUBLIC branch only: `(is_public AND deleted_at IS NULL)
-- OR id = auth.uid()`, not `(is_public OR own) AND deleted_at IS NULL`. That is
-- account_deletion's stated rule — public SELECT paths gain the tombstone
-- filter, own-row access is untouched — the same reason it deliberately left
-- the "Users can view their own profile" policy intact so a user can still load
-- /settings after requesting deletion. The reported hole is a tombstoned row
-- visible to OTHERS, and the public branch is the whole of it.
--
-- CREATE OR REPLACE rather than the DROP + CREATE the 20260624181348 original
-- used: replacing preserves the view's reloptions (no security_invoker, i.e.
-- owner-privilege, which is what that migration deliberately reverted to) and
-- keeps dependent objects and grants intact. The select list is byte-identical,
-- so REPLACE is legal — it may only append columns, never reorder or drop.
CREATE OR REPLACE VIEW community_stats AS
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
WHERE (p.is_public = true AND p.deleted_at IS NULL) OR p.id = auth.uid()
GROUP BY p.id;

REVOKE ALL ON community_stats FROM PUBLIC, anon, authenticated;
GRANT SELECT ON community_stats TO anon, authenticated;

-- ─────────────────────────────────────────────
-- 3. get_referral_leaderboard — anon-executable season standings
-- ─────────────────────────────────────────────
-- One filter added next to the is_public check it already carried, so the
-- referral board now matches get_leaderboard, which has had the tombstone
-- filter since 20260704140000.
--
-- Unchanged: LANGUAGE plpgsql, STABLE, SECURITY DEFINER, `SET search_path = ''`,
-- and the anon + authenticated EXECUTE grant re-stated below (this function has
-- never carried a REVOKE ... FROM PUBLIC — it is a public leaderboard — and this
-- migration does not change that).
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
      AND p.deleted_at IS NULL
      AND p.username IS NOT NULL
      AND p.username <> ''
    GROUP BY re.referrer_id, p.username, p.avatar_url
    ORDER BY COUNT(*) DESC, MIN(re.created_at) ASC
    LIMIT LEAST(p_limit, 100);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(INT, INT) TO authenticated, anon;
