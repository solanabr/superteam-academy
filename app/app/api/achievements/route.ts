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

  // If wallet provided, derive achievements from wallet-seeded progress
  if (wallet) {
    // Derive deterministic progress values from wallet address for personalized results
    const walletHash = wallet.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const completedLessons = (walletHash % 20) + 1;
    const completedCourses = Math.floor(completedLessons / 5);
    const streakDays = (walletHash % 30) + 1;
    const reviewsWritten = (walletHash % 8);
    const challengesSolved = (walletHash % 6);
    const forumPosts = (walletHash % 10);
    const hasCertificate = completedCourses >= 1;
    const unlockedIds = checkAchievements(
      completedLessons, completedCourses, streakDays,
      reviewsWritten, challengesSolved, forumPosts, hasCertificate
    );
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
