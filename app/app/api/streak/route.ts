import { NextRequest, NextResponse } from 'next/server';
import { getStreakData } from '@/lib/services/streak';

/**
 * Streak is frontend-only; this endpoint reads from a server-side store or returns empty.
 * Current impl: streak is in localStorage, so we return empty here. Frontend uses getStreakData() from streak.ts.
 */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ currentStreak: 0, longestStreak: 0, lastActivityDate: null, history: [] });
  }
  const data = getStreakData(wallet);
  return NextResponse.json(data);
}
