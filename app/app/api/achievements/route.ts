/**
 * GET /api/achievements — returns all achievements with unlock/eligible/claimed status.
 * Checks DB for awarded achievements and streak/activity data for eligibility.
 * Adds badge image path and on-chain claim state.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { ACHIEVEMENTS } from '@/backend/achievements';
import { prisma } from '@/backend/prisma';
import type { Achievement } from '@/context/types/achievement';

export async function GET(): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        // Return definitions with unlocked=false if not authenticated
        if (!session?.user?.id) {
            const achievements: Achievement[] = ACHIEVEMENTS.map((def) => ({
                ...def,
                unlocked: false,
                eligible: false,
                unlockedAt: null,
                asset: null,
                txSignature: null,
            }));
            return NextResponse.json(achievements);
        }

        const userId = session.user.id;

        // Fetch awarded achievements, streak, and activity from Prisma
        const [awarded, streakData, activityData] = await Promise.all([
            prisma.achievements.findMany({
                where: { user_id: userId },
                select: {
                    achievement_id: true,
                    awarded_at: true,
                    asset_address: true,
                    tx_hash: true,
                },
            }),
            prisma.streaks.findFirst({
                where: { user_id: userId },
                select: { current_streak: true, longest_streak: true },
            }),
            prisma.streak_activity.findMany({
                where: { user_id: userId },
                select: { lessons_completed: true, courses_completed: true },
            }),
        ]);

        const awardedMap = new Map(
            awarded.map((a) => [a.achievement_id, a])
        );

        // Calculate totals
        const totalLessons = activityData.reduce(
            (sum, a) => sum + (a.lessons_completed ?? 0), 0
        );
        const totalCourses = activityData.reduce(
            (sum, a) => sum + (a.courses_completed ?? 0), 0
        );
        const longestStreak = streakData?.longest_streak ?? 0;

        // Eligibility map (auto-unlock based on progress)
        const eligibleMap: Record<string, boolean> = {
            'first-steps': totalLessons >= 1,
            'course-completer': totalCourses >= 1,
            'five-courses': totalCourses >= 5,
            'ten-courses': totalCourses >= 10,
            'week-warrior': longestStreak >= 7,
            'monthly-master': longestStreak >= 30,
            'consistency-king': longestStreak >= 100,
        };

        const achievements: Achievement[] = ACHIEVEMENTS.map((def) => {
            const dbRecord = awardedMap.get(def.id);
            const isClaimed = !!dbRecord?.tx_hash;
            const isEligible = !isClaimed && (eligibleMap[def.id] ?? false);

            return {
                ...def,
                unlocked: isClaimed || isEligible,
                eligible: isEligible,
                unlockedAt: dbRecord
                    ? Math.floor(dbRecord.awarded_at.getTime() / 1000)
                    : null,
                asset: dbRecord?.asset_address ?? null,
                txSignature: dbRecord?.tx_hash ?? null,
            };
        });

        return NextResponse.json(achievements);
    } catch (error) {
        console.error('[Achievements] Error fetching achievements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch achievements' },
            { status: 500 }
        );
    }
}
