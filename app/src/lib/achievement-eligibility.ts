import { SupabaseClient } from "@supabase/supabase-js";

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  comingSoon?: boolean;
  adminOnly?: boolean;
}

const RUST_COURSE_PATTERNS = ["rust"];
const ANCHOR_COURSE_PATTERNS = ["anchor"];

export async function checkAllEligibility(
  supabase: SupabaseClient,
  userId: string,
  walletAddress?: string,
): Promise<Record<string, EligibilityResult>> {
  const [progressResult, streakResult, commentResult, helpResult] =
    await Promise.all([
      supabase
        .from("course_progress")
        .select(
          "course_id, completed_lessons, is_completed, enrolled_at, completed_at",
        )
        .eq("user_id", userId),
      supabase
        .from("streaks")
        .select("current_streak, longest_streak")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("community_help")
        .select("id", { count: "exact", head: true })
        .eq("helper_id", userId),
    ]);

  const progress = progressResult.data ?? [];
  const streak = streakResult.data;
  const commentCount = commentResult.count ?? 0;
  const helpCount = helpResult.count ?? 0;
  const results: Record<string, EligibilityResult> = {};

  // --- Progress ---
  const hasAnyLesson = progress.some(
    (p) => (p.completed_lessons?.length ?? 0) >= 1,
  );
  results["first-steps"] = {
    eligible: hasAnyLesson,
    reason: hasAnyLesson ? undefined : "Complete any lesson to unlock",
  };

  const completedCourses = progress.filter((p) => p.is_completed);
  results["course-completer"] = {
    eligible: completedCourses.length >= 1,
    reason: completedCourses.length >= 1
      ? undefined
      : "Complete all lessons in any course",
  };

  const hasSpeedRun = progress.some((p) => {
    if (!p.is_completed || !p.enrolled_at || !p.completed_at) return false;
    const elapsed =
      new Date(p.completed_at).getTime() - new Date(p.enrolled_at).getTime();
    return elapsed < 24 * 60 * 60 * 1000;
  });
  results["speed-runner"] = {
    eligible: hasSpeedRun,
    reason: hasSpeedRun
      ? undefined
      : "Complete a course within 24h of enrollment",
  };

  // --- Streaks ---
  const longest = Math.max(
    streak?.longest_streak ?? 0,
    streak?.current_streak ?? 0,
  );

  results["week-warrior"] = {
    eligible: longest >= 7,
    reason: longest >= 7 ? undefined : `${7 - longest} more days needed`,
  };
  results["monthly-master"] = {
    eligible: longest >= 30,
    reason: longest >= 30 ? undefined : `${30 - longest} more days needed`,
  };
  results["consistency-king"] = {
    eligible: longest >= 100,
    reason: longest >= 100 ? undefined : `${100 - longest} more days needed`,
  };

  // --- Skills ---
  const hasRust = completedCourses.some((p) =>
    RUST_COURSE_PATTERNS.some((pat) =>
      p.course_id?.toLowerCase().includes(pat),
    ),
  );
  results["rust-rookie"] = {
    eligible: hasRust,
    reason: hasRust ? undefined : "Complete the Rust Fundamentals course",
  };

  const hasAnchor = completedCourses.some((p) =>
    ANCHOR_COURSE_PATTERNS.some((pat) =>
      p.course_id?.toLowerCase().includes(pat),
    ),
  );
  results["anchor-expert"] = {
    eligible: hasAnchor,
    reason: hasAnchor
      ? undefined
      : "Complete all Anchor Framework courses",
  };

  results["full-stack-solana"] = {
    eligible: completedCourses.length >= 12,
    reason:
      completedCourses.length >= 12
        ? undefined
        : `${12 - completedCourses.length} more courses needed`,
  };

  // --- Community ---
  results["first-comment"] = {
    eligible: commentCount >= 1,
    reason: commentCount >= 1 ? undefined : "Leave a comment on any lesson",
  };

  results["helper"] = {
    eligible: helpCount >= 1,
    reason:
      helpCount >= 1
        ? undefined
        : "Have your comment marked as helpful by another learner",
  };

  // top-contributor: check leaderboard position
  let isTop10 = false;
  if (walletAddress) {
    const position = await checkLeaderboardPosition(walletAddress);
    isTop10 = position !== null && position <= 10;
  }
  results["top-contributor"] = {
    eligible: isTop10,
    reason: isTop10 ? undefined : "Reach the top 10 on the XP leaderboard",
  };

  // --- Special ---
  // early-adopter: supply-limited, always "eligible" — supply check is on-chain
  results["early-adopter"] = { eligible: true };

  results["bug-hunter"] = { eligible: false, adminOnly: true };
  results["perfect-score"] = { eligible: false, comingSoon: true };

  return results;
}

async function checkLeaderboardPosition(
  walletAddress: string,
): Promise<number | null> {
  try {
    const rpcUrl =
      process.env.NEXT_PUBLIC_HELIUS_RPC ??
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (!rpcUrl) return null;

    const xpMint =
      process.env.NEXT_PUBLIC_XP_MINT ??
      "5S5pSBFe968KdjAaG5yUXX1detFrE9vR4RGvT7JqRGjd";

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "leaderboard-check",
        method: "getTokenAccounts",
        params: { mint: xpMint, limit: 100 },
      }),
    });

    const result = await response.json();
    const accounts = result?.result?.token_accounts ?? [];

    const sorted = accounts
      .map((a: { owner: string; amount?: string }) => ({
        owner: a.owner,
        amount: Number(a.amount ?? 0),
      }))
      .sort(
        (a: { amount: number }, b: { amount: number }) =>
          b.amount - a.amount,
      );

    const idx = sorted.findIndex(
      (a: { owner: string }) => a.owner === walletAddress,
    );
    return idx >= 0 ? idx + 1 : null;
  } catch {
    return null;
  }
}
