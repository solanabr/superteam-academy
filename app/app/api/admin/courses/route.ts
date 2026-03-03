/**
 * Admin Courses API.
 *
 * GET /api/admin/courses — fetch all on-chain courses + Sanity CMS stats.
 * Protected by admin check.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Connection } from '@solana/web3.js';
import { authOptions } from '@/backend/auth/auth-options';
import { isAdmin } from '@/backend/admin/auth';
import { getRpcUrl } from '@/context/env';
import { fetchAllCourses, fetchCourseStats } from '@/context/solana/course-service';
import { cms } from '@/backend/cms/sanity';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !(await isAdmin(session))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const connection = new Connection(getRpcUrl(), 'confirmed');

        const [onChainCourses, courseStats, sanityCourses] = await Promise.all([
            fetchAllCourses(connection).catch(() => []),
            fetchCourseStats(connection).catch(() => ({
                totalCourses: 0,
                activeCourses: 0,
                totalEnrollments: 0,
                totalCompletions: 0,
            })),
            cms.getAllCourses().catch(() => []),
        ]);

        return NextResponse.json({
            courses: onChainCourses,
            stats: courseStats,
            sanityCourseCount: sanityCourses.length,
        });
    } catch (error) {
        console.error('[admin/courses]', error);
        return NextResponse.json(
            { error: 'Failed to fetch courses' },
            { status: 500 }
        );
    }
}
