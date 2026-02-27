import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GamificationService } from '@/lib/services/gamification-service';

/**
 * GET /api/gamification - Get user's gamification profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await GamificationService.getProfile(session.user.id);

    // Convert Map to object for JSON serialization
    const achievementProgress: Record<string, number> = {};
    profile.achievements.progress.forEach((value, key) => {
      achievementProgress[key] = value;
    });

    return NextResponse.json({
      xp: profile.xp,
      streak: profile.streak,
      achievements: {
        unlocked: profile.achievements.unlocked,
        available: profile.achievements.available,
        progress: achievementProgress,
      },
      rank: profile.rank,
      stats: profile.stats,
    });
  } catch (error) {
    console.error('Error fetching gamification profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
