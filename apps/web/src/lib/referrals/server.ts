import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/**
 * Referral program server seam (migration 20260818150000_referral_program.sql).
 *
 * Points are minted ONLY by the SECURITY DEFINER functions behind the admin
 * client — 1 for a referred signup (claim_referral), 1 per distinct course a
 * referred learner completes (record_referral_course_completion). The partial
 * unique indexes on referral_events make both once-only rules DB invariants,
 * so every caller here is free to retry or replay.
 */

/** The shape /api/referrals/leaderboard serves per row. */
export interface ReferralStanding {
  userId: string;
  username: string;
  avatarUrl: string | null;
  points: number;
  rank: number;
}

export interface ReferralSeason {
  number: number;
  startsAt: string;
  endsAt: string;
}

/**
 * Best-effort completion point — called from the course-finalized moment
 * (lib/helius/event-handlers.ts). NEVER throws: a referral bookkeeping failure
 * must not fail the webhook that also writes completed_at and bonus XP. The
 * DB's unique index makes webhook replays no-ops, so "fire on every finalize
 * event" is safe by construction.
 */
export async function recordReferralCoursePoint(
  userId: string,
  courseId: string
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc("record_referral_course_completion", {
      p_user_id: userId,
      p_course_id: courseId,
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    logError({
      errorId: ERROR_IDS.REFERRAL_POINT_FAILED,
      error: error instanceof Error ? error : new Error(String(error)),
      context: { step: "record_referral_course_completion", userId, courseId },
    });
  }
}

/**
 * Current-season standings plus the season window. Returns `season: null`
 * (and no standings) only when no season row exists at all.
 */
export async function getReferralLeaderboard(
  season: number | null,
  limit: number
): Promise<{ season: ReferralSeason | null; standings: ReferralStanding[] }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("get_referral_leaderboard", {
    ...(season !== null ? { p_season: season } : {}),
    p_limit: limit,
  });
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const first = rows[0];
  if (first) {
    return {
      season: {
        number: first.season_number,
        startsAt: first.season_starts_at,
        endsAt: first.season_ends_at,
      },
      standings: rows.map((r) => ({
        userId: r.user_id,
        username: r.username,
        avatarUrl: r.avatar_url,
        points: r.points,
        rank: r.rank,
      })),
    };
  }

  // Zero standings still needs the season window for the page header — read it
  // directly (public-SELECT table).
  const seasonRow =
    season !== null
      ? await supabase
          .from("referral_seasons")
          .select("number, starts_at, ends_at")
          .eq("number", season)
          .maybeSingle()
      : await supabase
          .from("referral_seasons")
          .select("number, starts_at, ends_at")
          .lte("starts_at", new Date().toISOString())
          .order("number", { ascending: false })
          .limit(1)
          .maybeSingle();
  if (seasonRow.error) throw new Error(seasonRow.error.message);

  return {
    season: seasonRow.data
      ? {
          number: seasonRow.data.number,
          startsAt: seasonRow.data.starts_at,
          endsAt: seasonRow.data.ends_at,
        }
      : null,
    standings: [],
  };
}

/**
 * A learner's own referral stats for the current season: their share code
 * (minted on first ask), season points, and lifetime referred-signup count.
 */
export async function getOwnReferralStats(userId: string): Promise<{
  code: string;
  seasonPoints: number;
  referredSignups: number;
  season: ReferralSeason | null;
}> {
  const supabase = createAdminClient();

  const { data: code, error: codeError } = await supabase.rpc(
    "get_or_create_referral_code",
    { p_user_id: userId }
  );
  if (codeError || !code) {
    throw new Error(codeError?.message ?? "code mint failed");
  }

  const nowIso = new Date().toISOString();
  const { data: seasonData, error: seasonError } = await supabase
    .from("referral_seasons")
    .select("number, starts_at, ends_at")
    .lte("starts_at", nowIso)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (seasonError) throw new Error(seasonError.message);
  const season: ReferralSeason | null = seasonData
    ? {
        number: seasonData.number,
        startsAt: seasonData.starts_at,
        endsAt: seasonData.ends_at,
      }
    : null;

  let seasonPoints = 0;
  if (season) {
    const { count, error } = await supabase
      .from("referral_events")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .gte("created_at", season.startsAt)
      .lt("created_at", season.endsAt);
    if (error) throw new Error(error.message);
    seasonPoints = count ?? 0;
  }

  const { count: signupCount, error: signupError } = await supabase
    .from("referral_events")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId)
    .eq("kind", "signup");
  if (signupError) throw new Error(signupError.message);

  return {
    code,
    seasonPoints,
    referredSignups: signupCount ?? 0,
    season,
  };
}
