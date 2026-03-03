/**
 * POST /api/streak/record
 *
 * Records daily activity and updates the user's streak.
 * Uses Prisma upsert to handle both new and existing streak/activity rows.
 *
 * Body: { xpEarned?: number, lessonsCompleted?: number, coursesCompleted?: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const xpEarned = Math.max(0, Number(body.xpEarned) || 0);
        const lessonsCompleted = Math.max(0, Number(body.lessonsCompleted) || 0);
        const coursesCompleted = Math.max(0, Number(body.coursesCompleted) || 0);
        const userId = session.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Upsert today's activity
        await prisma.streak_activity.upsert({
            where: {
                user_id_activity_date: {
                    user_id: userId,
                    activity_date: today,
                },
            },
            update: {
                xp_earned: { increment: xpEarned },
                lessons_completed: { increment: lessonsCompleted },
                courses_completed: { increment: coursesCompleted },
            },
            create: {
                user_id: userId,
                activity_date: today,
                xp_earned: xpEarned,
                lessons_completed: lessonsCompleted,
                courses_completed: coursesCompleted,
            },
        });

        // Update streak: find existing or create new
        const existing = await prisma.streaks.findFirst({
            where: { user_id: userId },
        });

        if (existing) {
            const lastDate = existing.last_activity_date;
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const isConsecutive = lastDate &&
                lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
            const isSameDay = lastDate &&
                lastDate.toISOString().split('T')[0] === today.toISOString().split('T')[0];

            let newStreak = existing.current_streak;
            if (isSameDay) {
                // Same day — no change
            } else if (isConsecutive) {
                newStreak = existing.current_streak + 1;
            } else {
                newStreak = 1; // Reset
            }

            const newLongest = Math.max(existing.longest_streak, newStreak);

            await prisma.streaks.update({
                where: { id: existing.id },
                data: {
                    current_streak: newStreak,
                    longest_streak: newLongest,
                    last_activity_date: today,
                },
            });

            return NextResponse.json({
                success: true,
                streak: { currentStreak: newStreak, longestStreak: newLongest },
            });
        } else {
            const newStreak = await prisma.streaks.create({
                data: {
                    user_id: userId,
                    current_streak: 1,
                    longest_streak: 1,
                    last_activity_date: today,
                },
            });

            return NextResponse.json({
                success: true,
                streak: { currentStreak: newStreak.current_streak, longestStreak: newStreak.longest_streak },
            });
        }
    } catch (error) {
        console.error('Streak record failed:', error);
        return NextResponse.json(
            { error: 'Failed to record streak activity' },
            { status: 500 }
        );
    }
}
