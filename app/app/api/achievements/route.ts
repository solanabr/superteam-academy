import { NextRequest, NextResponse } from 'next/server';
import { ACHIEVEMENTS_I18N, checkAchievements } from '@/lib/gamification';

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  const locale = request.nextUrl.searchParams.get('locale') ?? 'en';

  // Return all available achievements with unlock status
  const achievements = ACHIEVEMENTS_I18N.map(a => ({
    id: a.id,
    name: a.name[locale] ?? a.name['en'],
    description: a.description[locale] ?? a.description['en'],
    xp: a.xp,
    icon: a.icon,
    unlocked: false, // Default — overridden below if wallet provided
  }));

  // If wallet provided, check which are unlocked (mock data for demo)
  if (wallet) {
    const unlockedIds = checkAchievements(5, 2, 15, 10, 5, 1, false);
    for (const a of achievements) {
      if (unlockedIds.includes(a.id)) {
        a.unlocked = true;
      }
    }
  }

  return NextResponse.json({
    achievements,
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
  });
}
