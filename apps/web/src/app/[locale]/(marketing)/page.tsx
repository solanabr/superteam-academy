import { ERROR_IDS } from "@/constants/errorIds";
import { getAllCourses, getDeployedAchievements } from "@/lib/content/queries";
import { resolveFlagshipLessonHref } from "@/lib/courses/entry-lesson";
import { logError } from "@/lib/logging";
import { createAdminClient } from "@/lib/supabase/admin";
import { LandingPageClient } from "./landing-client";

// The landing shows live platform stats (courses, enrolled builders, credentials,
// XP). Without revalidation it renders fully static and freezes at build time —
// which is why "COURSES LIVE" showed 0 whenever the build-time Sanity fetch lagged
// and never refreshed. 5-minute ISR keeps the numbers current without per-request cost.
export const revalidate = 300;

interface PlatformStats {
  totalXpMinted: number;
  enrolledBuilders: number;
  credentialsIssued: number;
}

// Service-role (server-only) so this public landing can read aggregate counts.
// The anon client hits RLS ("own-row only" on profiles/certificates), so every
// count returned 0 — why the live page showed 0 builders/credentials despite real
// data. These are non-sensitive totals; the service key never reaches the client.
//
// One get_platform_stats() RPC (#1091) replaces the old three queries — the
// unbounded public_user_xp scan summed in JS plus two head counts. The RPC and
// the code deploy independently (Vercel auto-deploys main), so if the function
// is absent the old three-query path runs as a fallback instead of freezing
// the stats bar at 0 until ISR expires.
async function fetchPlatformStats(): Promise<PlatformStats> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("get_platform_stats");
    const row = data?.[0];
    if (!error && row) {
      return {
        totalXpMinted: row.total_xp,
        enrolledBuilders: row.builders,
        credentialsIssued: row.credentials,
      };
    }

    logError({
      errorId: ERROR_IDS.PLATFORM_STATS_RPC_FAILED,
      error: new Error(error?.message ?? "get_platform_stats returned no row"),
      context: { code: error?.code },
    });

    const [xpResult, enrollResult, certResult] = await Promise.all([
      supabase.from("public_user_xp").select("total_xp"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("certificates")
        .select("id", { count: "exact", head: true }),
    ]);
    return {
      totalXpMinted:
        xpResult.data?.reduce((sum, r) => sum + (r.total_xp ?? 0), 0) ?? 0,
      enrolledBuilders: enrollResult.count ?? 0,
      credentialsIssued: certResult.count ?? 0,
    };
  } catch {
    // Graceful fallback — stats bar shows 0
    return { totalXpMinted: 0, enrolledBuilders: 0, credentialsIssued: 0 };
  }
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [courses, achievements, flagshipLessonHref, stats] = await Promise.all([
    getAllCourses(),
    getDeployedAchievements(),
    resolveFlagshipLessonHref(locale),
    fetchPlatformStats(),
  ]);

  return (
    <LandingPageClient
      courseCount={courses.length}
      totalXpMinted={stats.totalXpMinted}
      enrolledBuilders={stats.enrolledBuilders}
      credentialsIssued={stats.credentialsIssued}
      achievements={achievements}
      flagshipLessonHref={flagshipLessonHref}
    />
  );
}
