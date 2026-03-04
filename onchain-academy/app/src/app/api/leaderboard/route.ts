import { NextRequest, NextResponse } from "next/server";
import { LeaderboardEntry } from "@/domain/models";
import { mockLeaderboard, mockCourses } from "@/domain/mock-data";
import { getLevelFromXp } from "@/lib/utils";
import { supabaseRest } from "@/lib/backend/server-supabase";

type CompletionAggregate = {
  learner_id: string;
  course_id: string;
  lesson_id: string;
};

type UserRow = {
  learner_id: string;
  display_name: string | null;
  wallet_address: string | null;
};

type ProfileRow = {
  learner_id: string;
  username: string | null;
};

type JsonRpcResponse<T> = { error?: { message: string }; result?: T };

const DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const XP_MINT = process.env.NEXT_PUBLIC_XP_MINT ?? "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3";

async function rpc<T>(method: string, params: unknown[]) {
  const response = await fetch(DEVNET_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "leaderboard-api",
      method,
      params,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as JsonRpcResponse<T>;
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.result as T;
}

function normalizeWindow(window: string | null) {
  if (window === "weekly" || window === "monthly") return window;
  return "all-time";
}

function buildFromAggregates(completions: CompletionAggregate[], users: UserRow[], profiles: ProfileRow[]): LeaderboardEntry[] {
  const perCourseXp = new Map(
    mockCourses.map((course) => [course.id, Math.max(1, Math.round(course.xpReward / course.lessons.length))]),
  );

  const xpByLearner = new Map<string, number>();
  completions.forEach((row) => {
    const earned = perCourseXp.get(row.course_id) ?? 10;
    xpByLearner.set(row.learner_id, (xpByLearner.get(row.learner_id) ?? 0) + earned);
  });

  const userMap = new Map(users.map((u) => [u.learner_id, u]));
  const profileMap = new Map(profiles.map((p) => [p.learner_id, p]));
  return [...xpByLearner.entries()]
    .map(([learnerId, xp]) => {
      const user = userMap.get(learnerId);
      const profile = profileMap.get(learnerId);
      const wallet = user?.wallet_address ?? learnerId;
      const name =
        profile?.username?.trim() ||
        user?.display_name ||
        (learnerId.includes("@") ? learnerId.split("@")[0] : `${learnerId.slice(0, 4)}...${learnerId.slice(-4)}`);
      return {
        rank: 0,
        wallet,
        name,
        xp,
        level: getLevelFromXp(xp),
        streak: 0,
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function buildFromXpBalances(
  xpByWallet: Array<{ wallet: string; xp: number }>,
  users: UserRow[],
  profiles: ProfileRow[],
): LeaderboardEntry[] {
  const byWallet = new Map<string, UserRow>();
  users.forEach((user) => {
    if (user.wallet_address) {
      byWallet.set(user.wallet_address, user);
    }
  });
  const profileMap = new Map(profiles.map((p) => [p.learner_id, p]));

  return xpByWallet
    .map(({ wallet, xp }) => {
      const user = byWallet.get(wallet);
      const profile = user?.learner_id ? profileMap.get(user.learner_id) : null;
      const fallbackName = `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
      return {
        rank: 0,
        wallet,
        name: profile?.username?.trim() || user?.display_name || fallbackName,
        xp,
        level: getLevelFromXp(xp),
        streak: 0,
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

async function getXpBalancesFromTokenHolders(): Promise<Array<{ wallet: string; xp: number }>> {
  const largest = await rpc<{
    value: Array<{ address: string; amount: string }>;
  }>("getTokenLargestAccounts", [XP_MINT, { commitment: "confirmed" }]);

  const tokenAccounts = largest.value ?? [];
  if (tokenAccounts.length === 0) return [];

  const accountInfos = await Promise.all(
    tokenAccounts.map(async (item) => {
      const info = await rpc<{
        value: {
          data?: { parsed?: { info?: { owner?: string } } };
        } | null;
      }>("getAccountInfo", [item.address, { encoding: "jsonParsed", commitment: "confirmed" }]);
      const owner = info.value?.data?.parsed?.info?.owner ?? null;
      return owner ? { wallet: owner, xp: Number(item.amount) } : null;
    }),
  );

  const byWallet = new Map<string, number>();
  accountInfos.forEach((entry) => {
    if (!entry) return;
    byWallet.set(entry.wallet, (byWallet.get(entry.wallet) ?? 0) + entry.xp);
  });

  return [...byWallet.entries()].map(([wallet, xp]) => ({ wallet, xp }));
}

export async function GET(request: NextRequest) {
  const window = normalizeWindow(request.nextUrl.searchParams.get("window"));
  const courseId = request.nextUrl.searchParams.get("courseId");

  if (!supabaseRest.hasConfig()) {
    return NextResponse.json(
      mockLeaderboard.map((entry) => ({
        ...entry,
        level: getLevelFromXp(entry.xp),
      })),
    );
  }

  const now = new Date();
  const since = new Date(now);
  if (window === "weekly") {
    since.setDate(now.getDate() - 7);
  } else if (window === "monthly") {
    since.setDate(now.getDate() - 30);
  } else {
    since.setFullYear(2000);
  }

  const users = await supabaseRest.select<UserRow>({
    table: "academy_users",
    select: "learner_id,display_name,wallet_address",
  });
  const profiles = await supabaseRest.select<ProfileRow>({
    table: "academy_user_profiles",
    select: "learner_id,username",
  });

  if (!courseId) {
    try {
      const xpBalances = await getXpBalancesFromTokenHolders();
      if (xpBalances.length > 0) {
        const entries = buildFromXpBalances(xpBalances, users ?? [], profiles ?? []);
        return NextResponse.json(entries);
      }
    } catch {
      // Fallback to completion-derived XP when RPC indexing is unavailable.
    }
  }

  const completions = await supabaseRest.select<CompletionAggregate>({
    table: "academy_lesson_completions",
    select: "learner_id,course_id,lesson_id",
    filters: {
      completed_at: `gte.${since.toISOString()}`,
      ...(courseId ? { course_id: `eq.${courseId}` } : {}),
    },
  });
  const entries = buildFromAggregates(completions ?? [], users ?? [], profiles ?? []);
  return NextResponse.json(entries);
}
