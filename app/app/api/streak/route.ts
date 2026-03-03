/**
 * GET /api/streak
 *
 * Returns the current user's streak data + recent activity (last 90 days) + milestone status.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';
import { STREAK_MILESTONES, DEFAULT_STREAK } from '@/context/types/streak';
import type { Streak, StreakDay, StreakMilestone, StreakData } from '@/context/types/streak';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch streak state
        const streakRow = await prisma.streaks.findFirst({
            where: { user_id: userId },
        });

        const streak: Streak = streakRow
            ? {
                currentStreak: streakRow.current_streak,
                longestStreak: streakRow.longest_streak,
                lastActivityDate: streakRow.last_activity_date?.toISOString().split('T')[0] ?? null,
                freezeCount: streakRow.freeze_count,
                maxFreezes: streakRow.max_freezes,
            }
            : DEFAULT_STREAK;

        // Fetch activity from the start of current year (for full-year heatmap)
        const yearStart = new Date(new Date().getFullYear(), 0, 1);

        const activityRows = await prisma.streak_activity.findMany({
            where: {
                user_id: userId,
                activity_date: { gte: yearStart },
            },
            select: {
                activity_date: true,
                xp_earned: true,
                lessons_completed: true,
                courses_completed: true,
            },
            orderBy: { activity_date: 'asc' },
        });

        const activity: StreakDay[] = activityRows.map((r) => ({
            date: r.activity_date.toISOString().split('T')[0],
            xpEarned: r.xp_earned,
            lessonsCompleted: r.lessons_completed,
            coursesCompleted: r.courses_completed,
        }));

        // Fetch claimed milestones
        const claimedRows = await prisma.streak_milestones.findMany({
            where: { user_id: userId },
            select: { milestone_days: true },
        });

        const claimedSet = new Set(claimedRows.map((r) => r.milestone_days));

        const milestones: StreakMilestone[] = STREAK_MILESTONES.map((m) => ({
            ...m,
            claimed: claimedSet.has(m.days),
        }));

        const data: StreakData = { streak, activity, milestones };
        return NextResponse.json(data);
    } catch (error) {
        console.error('Streak fetch failed:', error);
        return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 });
    }
}
