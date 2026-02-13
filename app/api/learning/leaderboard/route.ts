import { NextRequest, NextResponse } from 'next/server';
import { getStoredLeaderboard } from '@/lib/learning/server-progress-store';
import { Timeframe } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseTimeframe(value: string | null): Timeframe {
  if (value === 'weekly' || value === 'monthly' || value === 'alltime') {
    return value;
  }

  return 'alltime';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const timeframe = parseTimeframe(request.nextUrl.searchParams.get('timeframe'));
  const leaderboard = await getStoredLeaderboard(timeframe);

  return NextResponse.json({ timeframe, leaderboard });
}
