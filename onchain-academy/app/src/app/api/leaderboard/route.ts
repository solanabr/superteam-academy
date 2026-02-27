import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { connection } from "@/lib/solana/connection";
import { XP_MINT_ADDRESS, calculateLevel } from "@/lib/constants";
import type { LeaderboardEntry } from "@/lib/services/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

let cache: { data: LeaderboardEntry[]; ts: number } | null = null;
let enrichedCache: { data: LeaderboardEntry[]; ts: number } | null = null;
const CACHE_TTL = 60_000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

type Timeframe = "weekly" | "monthly" | "alltime";

const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  weekly: 7,
  monthly: 30,
  alltime: 0,
};

/** Fetch current on-chain XP balances (cached). */
async function getAllTimeEntries(): Promise<LeaderboardEntry[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  // Raw data refreshing — invalidate enriched cache too
  enrichedCache = null;

  if (!XP_MINT_ADDRESS) return [];

  const mint = new PublicKey(XP_MINT_ADDRESS);
  const largestAccounts = await connection.getTokenLargestAccounts(mint);

  const entries: LeaderboardEntry[] = [];

  for (const account of largestAccounts.value) {
    if (account.uiAmount === null || account.uiAmount === 0) continue;

    const accountInfo = await connection.getParsedAccountInfo(account.address);
    const data = accountInfo.value?.data;
    const parsed =
      typeof data === "object" && data !== null && "parsed" in data
        ? (data as { parsed: { info?: { owner?: string } } }).parsed
        : undefined;
    const owner = parsed?.info?.owner;
    if (!owner) continue;

    const xp = account.uiAmount;
    entries.push({ rank: 0, wallet: owner, xp, level: calculateLevel(xp), streak: 0 });
  }

  entries.sort((a, b) => b.xp - a.xp);
  entries.forEach((e, i) => (e.rank = i + 1));

  cache = { data: entries, ts: Date.now() };
  return entries;
}

/** Enrich on-chain entries with Supabase profile data and completion counts. */
async function enrichWithSupabase(
  entries: LeaderboardEntry[],
): Promise<LeaderboardEntry[]> {
  if (enrichedCache && Date.now() - enrichedCache.ts < CACHE_TTL) {
    return enrichedCache.data;
  }

  try {
    const supabase = getSupabaseAdmin();
    const wallets = entries.map((e) => e.wallet);

    const [profilesResult, eventsResult] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("user_id, display_name, show_on_leaderboard")
        .in("user_id", wallets),
      supabase
        .from("enrollment_events")
        .select("wallet")
        .eq("event_type", "finalize_course")
        .in("wallet", wallets),
    ]);

    const profileMap = new Map<string, { displayName: string; show: boolean }>();
    if (profilesResult.data) {
      for (const row of profilesResult.data) {
        profileMap.set(row.user_id, {
          displayName: row.display_name || "",
          show: row.show_on_leaderboard ?? true,
        });
      }
    }

    const completionMap = new Map<string, number>();
    if (eventsResult.data) {
      for (const row of eventsResult.data) {
        completionMap.set(row.wallet, (completionMap.get(row.wallet) ?? 0) + 1);
      }
    }

    const enriched: LeaderboardEntry[] = [];
    for (const entry of entries) {
      const profile = profileMap.get(entry.wallet);
      if (profile && !profile.show) continue;
      enriched.push({
        ...entry,
        displayName: profile?.displayName || entry.displayName,
        coursesCompleted: completionMap.get(entry.wallet) ?? entry.coursesCompleted,
      });
    }

    enriched.sort((a, b) => b.xp - a.xp);
    enriched.forEach((e, i) => (e.rank = i + 1));

    enrichedCache = { data: enriched, ts: Date.now() };
    return enriched;
  } catch (err) {
    console.error("[leaderboard] Supabase enrichment failed (non-fatal):", err);
    return entries;
  }
}

/**
 * Compute time-windowed leaderboard by diffing current balances against
 * the closest snapshot from `days` ago. Returns null if no snapshot data exists.
 */
async function getTimeFilteredEntries(
  currentEntries: LeaderboardEntry[],
  days: number,
): Promise<{ entries: LeaderboardEntry[]; hasData: boolean }> {
  try {
    const supabase = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Get the most recent snapshot per wallet that's at least `days` old
    const { data: snapshots, error } = await supabase
      .from("xp_snapshots")
      .select("wallet, xp_balance")
      .lte("recorded_at", cutoff)
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("[leaderboard] Supabase query error:", error);
      return { entries: [], hasData: false };
    }

    if (!snapshots || snapshots.length === 0) {
      return { entries: [], hasData: false };
    }

    // Deduplicate: keep the most recent snapshot per wallet (already ordered desc)
    const snapshotMap = new Map<string, number>();
    for (const row of snapshots) {
      if (!snapshotMap.has(row.wallet)) {
        snapshotMap.set(row.wallet, row.xp_balance);
      }
    }

    // Compute XP gained in the time window
    const entries: LeaderboardEntry[] = [];
    for (const entry of currentEntries) {
      const oldXp = snapshotMap.get(entry.wallet) ?? 0;
      const gained = entry.xp - oldXp;
      if (gained > 0) {
        entries.push({
          ...entry,
          rank: 0,
          xp: gained,
          level: calculateLevel(gained),
        });
      }
    }

    entries.sort((a, b) => b.xp - a.xp);
    entries.forEach((e, i) => (e.rank = i + 1));

    return { entries, hasData: true };
  } catch {
    return { entries: [], hasData: false };
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT)),
    );
    const timeframe = (searchParams.get("timeframe") ?? "alltime") as Timeframe;

    const rawEntries = await getAllTimeEntries();
    const allTimeEntries = await enrichWithSupabase(rawEntries);
    const days = TIMEFRAME_DAYS[timeframe] || 0;

    let entries: LeaderboardEntry[];
    let snapshotDataAvailable = true;

    if (days > 0) {
      const result = await getTimeFilteredEntries(allTimeEntries, days);
      entries = result.entries;
      snapshotDataAvailable = result.hasData;
    } else {
      entries = allTimeEntries;
    }

    const total = entries.length;
    const start = (page - 1) * limit;
    const slice = entries.slice(start, start + limit);

    return NextResponse.json({
      entries: slice,
      page,
      limit,
      total,
      timeframe,
      snapshotDataAvailable,
    });
  } catch (err: unknown) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({
      entries: [],
      page: 1,
      limit: DEFAULT_LIMIT,
      total: 0,
      timeframe: "alltime",
      snapshotDataAvailable: false,
    });
  }
}
