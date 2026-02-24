import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isAdminRequest } from "@/lib/auth/admin";
import { getReadonlyProgram, getAccounts } from "@/lib/solana/program";
import { connection } from "@/lib/solana/connection";
import { XP_MINT_ADDRESS, TRACK_TYPES } from "@/lib/constants";
import { courses } from "@/lib/services/courses";
import { getEnrollmentsByDay } from "@/lib/supabase/enrollment-events";

export interface AdminStats {
  totalCourses: number;
  activeLearners: number;
  credentialsIssued: number;
  totalXpDistributed: number;
  enrollmentsByDay: { date: string; count: number }[];
  completionRate: number;
  xpByTrack: { track: string; xp: number }[];
  courseBreakdown: {
    active: number;
    total: number;
    byTrack: Record<string, number>;
  };
}

let cache: { data: AdminStats; ts: number } | null = null;
const CACHE_TTL = 30_000;

export async function GET(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const program = getReadonlyProgram(connection);
    const accounts = getAccounts(program);

    // Fetch all on-chain courses
    let onChainCourses: Awaited<ReturnType<typeof accounts.course.all>> = [];
    try {
      onChainCourses = await accounts.course.all();
    } catch {
      // Program may not be deployed or no courses created yet
    }

    const totalCourses =
      onChainCourses.length > 0 ? onChainCourses.length : courses.length;
    const activeCourses = onChainCourses.length > 0
      ? onChainCourses.filter((c) => c.account.isActive).length
      : courses.length;

    // Compute total enrollments and completions from on-chain course data
    let totalEnrollments = 0;
    let totalCompletions = 0;
    const byTrack: Record<string, number> = {};

    for (const c of onChainCourses) {
      totalEnrollments += c.account.totalEnrollments;
      totalCompletions += c.account.totalCompletions;
      const trackIndex = c.account.trackId;
      const trackName =
        trackIndex < TRACK_TYPES.length
          ? TRACK_TYPES[trackIndex]
          : `track-${trackIndex}`;
      byTrack[trackName] = (byTrack[trackName] ?? 0) + 1;
    }

    // If no on-chain data, use static course list for track breakdown
    if (onChainCourses.length === 0) {
      for (const c of courses) {
        byTrack[c.track] = (byTrack[c.track] ?? 0) + 1;
      }
    }

    const completionRate =
      totalEnrollments > 0
        ? Math.round((totalCompletions / totalEnrollments) * 100)
        : 0;

    // Query XP mint supply and token holders
    let totalXpDistributed = 0;
    let activeLearners = 0;
    const xpByTrack: { track: string; xp: number }[] = [];

    if (XP_MINT_ADDRESS) {
      try {
        const mint = new PublicKey(XP_MINT_ADDRESS);
        const supply = await connection.getTokenSupply(mint);
        totalXpDistributed = supply.value.uiAmount ?? 0;

        const largestAccounts = await connection.getTokenLargestAccounts(mint);
        activeLearners = largestAccounts.value.filter(
          (a) => a.uiAmount !== null && a.uiAmount > 0,
        ).length;
      } catch {
        // Mint may not exist on current network
      }
    }

    // Compute XP by track from on-chain course completions
    for (const track of TRACK_TYPES) {
      const trackCourses = onChainCourses.filter((c) => {
        const idx = c.account.trackId;
        return idx < TRACK_TYPES.length && TRACK_TYPES[idx] === track;
      });
      let trackXp = 0;
      for (const c of trackCourses) {
        trackXp += c.account.totalCompletions * c.account.xpPerLesson * c.account.lessonCount;
      }
      if (trackXp > 0 || byTrack[track]) {
        xpByTrack.push({ track, xp: trackXp });
      }
    }

    // If no on-chain XP data, estimate from static courses
    if (xpByTrack.length === 0) {
      for (const track of TRACK_TYPES) {
        const trackCourses = courses.filter((c) => c.track === track);
        const xp = trackCourses.reduce((sum, c) => sum + c.xpReward, 0);
        if (xp > 0) {
          xpByTrack.push({ track, xp });
        }
      }
    }

    const enrollmentsByDay = await getEnrollmentsByDay(30);

    const stats: AdminStats = {
      totalCourses,
      activeLearners,
      credentialsIssued: totalCompletions,
      totalXpDistributed,
      enrollmentsByDay,
      completionRate,
      xpByTrack,
      courseBreakdown: {
        active: activeCourses,
        total: totalCourses,
        byTrack,
      },
    };

    cache = { data: stats, ts: Date.now() };
    return NextResponse.json(stats);
  } catch (err: unknown) {
    console.error("Admin stats error:", err);

    // Fallback to computed stats from static course data
    const byTrack: Record<string, number> = {};
    for (const c of courses) {
      byTrack[c.track] = (byTrack[c.track] ?? 0) + 1;
    }
    const xpByTrack = TRACK_TYPES.map((track) => ({
      track,
      xp: courses
        .filter((c) => c.track === track)
        .reduce((sum, c) => sum + c.xpReward, 0),
    })).filter((t) => t.xp > 0);

    const fallback: AdminStats = {
      totalCourses: courses.length,
      activeLearners: 0,
      credentialsIssued: 0,
      totalXpDistributed: 0,
      enrollmentsByDay: [],
      completionRate: 0,
      xpByTrack,
      courseBreakdown: {
        active: courses.length,
        total: courses.length,
        byTrack,
      },
    };

    return NextResponse.json(fallback);
  }
}
