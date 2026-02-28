import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/content';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
  const country = searchParams.get('country');
  const period = searchParams.get('period') ?? 'all-time'; // all-time | weekly | monthly

  let users = await getLeaderboard(limit);

  if (country) {
    users = users.filter(u => u.country === country);
  }

  if (period === 'weekly') {
    users = [...users].sort((a, b) => b.weeklyXP - a.weeklyXP);
  }

  return NextResponse.json({
    leaderboard: users,
    total: users.length,
    period,
    filters: { country, limit },
  });
}
