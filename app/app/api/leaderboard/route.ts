import { NextRequest, NextResponse } from 'next/server';
import { learningProgressService } from '@/lib/services/learning-progress';
import type { LeaderboardTimeframe } from '@/lib/services/types';

export async function GET(request: NextRequest) {
  const timeframe = (request.nextUrl.searchParams.get('timeframe') || 'all-time') as LeaderboardTimeframe;
  if (!['weekly', 'monthly', 'all-time'].includes(timeframe)) {
    return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 });
  }
  const entries = await learningProgressService.getLeaderboard(timeframe);
  return NextResponse.json({ entries });
}
