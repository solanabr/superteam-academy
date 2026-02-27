import { NextRequest, NextResponse } from 'next/server';
import {
  LeaderboardService,
  LeaderboardTimeframe,
  LeaderboardSortBy,
} from '@/services/leaderboard.service';

/**
 * GET /api/leaderboard
 * Get leaderboard entries with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const timeframe = (searchParams.get('timeframe') || 'all-time') as LeaderboardTimeframe;
    const sortBy = (searchParams.get('sortBy') || 'xp') as LeaderboardSortBy;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    // Validate timeframe
    if (!['all-time', 'monthly', 'weekly'].includes(timeframe)) {
      return NextResponse.json(
        { error: 'Invalid timeframe. Use "all-time", "monthly", or "weekly"' },
        { status: 400 }
      );
    }

    // Validate sortBy
    if (!['xp', 'streak', 'courses'].includes(sortBy)) {
      return NextResponse.json(
        { error: 'Invalid sortBy. Use "xp", "streak", or "courses"' },
        { status: 400 }
      );
    }

    // Get leaderboard
    const { entries, total } = await LeaderboardService.getLeaderboard({
      timeframe,
      sortBy,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
      courseId: courseId || undefined,
    });

    // If userId provided, get their rank and nearby users
    let userRank = null;
    let nearbyUsers = null;

    if (userId) {
      userRank = await LeaderboardService.getUserRank(userId, timeframe);
      nearbyUsers = await LeaderboardService.getUsersNearRank(userId, 2);
    }

    return NextResponse.json({
      entries,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + entries.length < total,
      },
      userContext: userId
        ? {
            rank: userRank,
            nearbyUsers,
          }
        : null,
    });
  } catch (error) {
    console.error('GET /api/leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
