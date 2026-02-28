import { NextRequest, NextResponse } from 'next/server';
import { MOCK_LEADERBOARD } from '@/lib/mock-data';
import { calcLevel, getLevelTitle, getStreakBonus, checkAchievements } from '@/lib/gamification';
import { getUserRole } from '@/lib/rbac';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  if (!address || address.length < 32) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  // Check if user exists in mock data
  const user = MOCK_LEADERBOARD.find(u => u.walletAddress === address);

  if (!user) {
    // Return a default profile for unknown addresses
    const role = getUserRole(address);
    return NextResponse.json({
      address,
      username: null,
      displayName: null,
      role,
      level: 0,
      levelTitle: getLevelTitle(0, 'en'),
      totalXP: 0,
      streakDays: 0,
      streakBonus: '1x XP',
      completedCourses: 0,
      achievements: [],
    });
  }

  const level = calcLevel(user.totalXP);
  const achievements = checkAchievements(
    user.completedCourses * 10, user.completedCourses,
    user.streakDays, 0, MOCK_LEADERBOARD.indexOf(user) + 1,
    0, false
  );

  return NextResponse.json({
    address: user.walletAddress,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    role: getUserRole(user.walletAddress),
    level,
    levelTitle: getLevelTitle(level, 'en'),
    totalXP: user.totalXP,
    streakDays: user.streakDays,
    streakBonus: getStreakBonus(user.streakDays),
    weeklyXP: user.weeklyXP,
    completedCourses: user.completedCourses,
    country: user.country,
    achievements,
  });
}
