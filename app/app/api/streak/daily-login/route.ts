/**
 * GET + POST /api/streak/daily-login
 *
 * GET: Returns current daily login streak state.
 * POST: Records a daily login, awards XP, handles streak break.
 *
 * XP formula: Day N of streak → N × 10 XP for that day.
 * Streak break: offchain_xp resets to 0, total_login_xp resets to 0.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth/auth-options';
import { prisma } from '@/backend/prisma';
import type { DailyLoginStreak } from '@/context/types/daily-login';

/** Get today's date as YYYY-MM-DD in IST (UTC+5:30) */
function todayIST(): string {
    const now = new Date();
    // Offset to IST: add 5 hours 30 minutes
    const ist = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
    return ist.toISOString().split('T')[0];
}

/** Get yesterday's date as YYYY-MM-DD in IST (UTC+5:30) */
function yesterdayIST(): string {
    const now = new Date();
    const ist = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
    ist.setUTCDate(ist.getUTCDate() - 1);
    return ist.toISOString().split('T')[0];
}

export async function GET(): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const row = await prisma.daily_login_streaks.findUnique({
            where: { user_id: session.user.id },
            select: {
                current_streak: true,
                longest_streak: true,
                last_login_date: true,
                total_login_xp: true,
                streak_broken: true,
            },
        });

        const today = todayIST();
        const lastDate = row?.last_login_date?.toISOString().split('T')[0] ?? null;
        const todayCredited = lastDate === today;

        // Check if streak would be broken (missed yesterday)
        const isConsecutive = lastDate === yesterdayIST() || lastDate === today;
        const currentStreak = (row && isConsecutive) ? row.current_streak : 0;
        const todayXp = todayCredited ? 0 : (currentStreak + 1) * 10;

        const state: DailyLoginStreak = {
            currentStreak: row?.current_streak ?? 0,
            longestStreak: row?.longest_streak ?? 0,
            lastLoginDate: lastDate,
            totalLoginXp: row?.total_login_xp ?? 0,
            streakBroken: row?.streak_broken ?? false,
            todayXp,
            todayCredited,
        };

        return NextResponse.json(state);
    } catch (error) {
        console.error('[DailyLogin] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch login streak' }, { status: 500 });
    }
}

export async function POST(): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const today = todayIST();
        const yesterday = yesterdayIST();

        // Get or create login streak row
        let row = await prisma.daily_login_streaks.findUnique({
            where: { user_id: userId },
            select: {
                current_streak: true,
                longest_streak: true,
                last_login_date: true,
                total_login_xp: true,
                streak_broken: true,
            },
        });

        const lastDate = row?.last_login_date?.toISOString().split('T')[0] ?? null;

        // Already credited today
        if (lastDate === today) {
            return NextResponse.json({
                currentStreak: row!.current_streak,
                longestStreak: row!.longest_streak,
                lastLoginDate: today,
                totalLoginXp: row!.total_login_xp,
                streakBroken: false,
                todayXp: 0,
                todayCredited: true,
            } satisfies DailyLoginStreak);
        }

        let newStreak: number;
        let streakBroken = false;
        let previousLoginXp = row?.total_login_xp ?? 0;

        if (!row) {
            // First ever login
            newStreak = 1;
        } else if (lastDate === yesterday) {
            // Consecutive day
            newStreak = row.current_streak + 1;
        } else {
            // Streak broken — reset XP
            newStreak = 1;
            streakBroken = true;
            previousLoginXp = 0; // Will be reset
        }

        const todayXp = newStreak * 10;
        const newTotalLoginXp = streakBroken ? todayXp : previousLoginXp + todayXp;
        const newLongest = Math.max(row?.longest_streak ?? 0, newStreak);

        // Upsert the login streak
        row = await prisma.daily_login_streaks.upsert({
            where: { user_id: userId },
            update: {
                current_streak: newStreak,
                longest_streak: newLongest,
                last_login_date: new Date(today),
                total_login_xp: newTotalLoginXp,
                streak_broken: streakBroken,
            },
            create: {
                user_id: userId,
                current_streak: newStreak,
                longest_streak: newLongest,
                last_login_date: new Date(today),
                total_login_xp: newTotalLoginXp,
                streak_broken: false,
            },
        });

        // Update profiles.offchain_xp
        if (streakBroken) {
            // Reset offchain_xp to just today's XP (old login XP wiped)
            await prisma.profiles.update({
                where: { id: userId },
                data: { offchain_xp: todayXp },
            });
        } else {
            // Add today's XP to offchain_xp
            await prisma.profiles.update({
                where: { id: userId },
                data: { offchain_xp: { increment: todayXp } },
            });
        }

        // Also record login as streak_activity so heatmap can show it
        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);
        await prisma.streak_activity.upsert({
            where: {
                user_id_activity_date: {
                    user_id: userId,
                    activity_date: todayDate,
                },
            },
            update: {
                xp_earned: { increment: todayXp },
            },
            create: {
                user_id: userId,
                activity_date: todayDate,
                xp_earned: todayXp,
                lessons_completed: 0,
                courses_completed: 0,
            },
        });

        const result: DailyLoginStreak = {
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastLoginDate: today,
            totalLoginXp: newTotalLoginXp,
            streakBroken,
            todayXp,
            todayCredited: true,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('[DailyLogin] POST error:', error);
        return NextResponse.json({ error: 'Failed to record login' }, { status: 500 });
    }
}
