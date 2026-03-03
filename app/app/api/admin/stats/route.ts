/**
 * Admin Stats API route.
 *
 * Aggregates platform statistics from on-chain data (courses, enrollments)
 * and Prisma DB (users, achievements, streaks, audit logs).
 *
 * Protected by admin session check.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Connection } from '@solana/web3.js';
import { authOptions } from '@/backend/auth/auth-options';
import { isAdmin } from '@/backend/admin/auth';
import { getRpcUrl } from '@/context/env';
import { fetchCourseStats } from '@/context/solana/course-service';
import { prisma } from '@/backend/prisma';
import { startOfToday, ADMIN_ACTIVITY_LIMIT } from '@/backend/admin/utils';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!(await isAdmin(session))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const today = startOfToday();

        const connection = new Connection(getRpcUrl(), 'confirmed');

        const [
            courseStats,
            totalUsers,
            activeToday,
            totalAwards,
            activeStreaks,
            recentLogs,
        ] = await Promise.all([
            fetchCourseStats(connection),
            prisma.profiles.count(),
            prisma.streak_activity.count({
                where: { activity_date: today },
            }),
            prisma.achievements.count(),
            prisma.streaks.count({
                where: { current_streak: { gt: 0 } },
            }),
            prisma.audit_logs.findMany({
                orderBy: { created_at: 'desc' },
                take: ADMIN_ACTIVITY_LIMIT,
                select: {
                    id: true,
                    action: true,
                    user_id: true,
                    ip_address: true,
                    created_at: true,
                },
            }),
        ]);

        return NextResponse.json({
            courses: courseStats,
            totalUsers,
            activeToday,
            totalAwards,
            activeStreaks,
            recentLogs: recentLogs.map((log) => ({
                ...log,
                created_at: log.created_at.toISOString(),
            })),
        });
    } catch (error) {
        console.error('[admin/stats]', error);
        return NextResponse.json(
            { error: 'Failed to fetch admin stats' },
            { status: 500 }
        );
    }
}
