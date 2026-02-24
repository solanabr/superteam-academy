import { NextResponse } from "next/server";

/**
 * POST /api/award-streak-freeze
 *
 * The on-chain award_streak_freeze instruction was removed in the program rewrite.
 * This endpoint implements a localStorage-compatible streak freeze system:
 * each wallet gets 1 free freeze per calendar week (UTC). The client stores
 * the freeze in localStorage; this route validates and returns the grant.
 */

const FREEZES_PER_WEEK = 1;

interface FreezeRequest {
  wallet?: string;
  /** ISO date string of the last freeze claimed, sent by the client */
  lastFreezeWeek?: string;
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FreezeRequest;
    const { wallet, lastFreezeWeek } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: "Missing required field: wallet" },
        { status: 400 },
      );
    }

    const currentWeek = getISOWeek(new Date());

    if (lastFreezeWeek === currentWeek) {
      return NextResponse.json(
        { error: "Streak freeze already claimed this week", currentWeek },
        { status: 409 },
      );
    }

    return NextResponse.json({
      granted: true,
      freezesAvailable: FREEZES_PER_WEEK,
      currentWeek,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }
}
