import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GamificationService } from '@/lib/services/gamification-service';
import { LeaderboardTimeframe } from '@/types/gamification';

/**
 * GET /api/gamification/leaderboard - Get XP leaderboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const timeframeParam = searchParams.get('timeframe') as LeaderboardTimeframe | null;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Validate limit
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const timeframe: LeaderboardTimeframe = timeframeParam || 'all-time';

    const [leaderboardData, userRank] = await Promise.all([
      GamificationService.getLeaderboard(timeframe, safeLimit),
      GamificationService.getUserRank(session.user.id),
    ]);

    return NextResponse.json({
      leaderboard: leaderboardData.entries,
      userRank,
      totalUsers: leaderboardData.totalUsers,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
