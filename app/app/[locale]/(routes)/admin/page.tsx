/**
 * Admin dashboard page — server component.
 * Platform stats, activity feed, whitelist management, API health.
 * No emojis, lightweight inline styles, system fonts.
 */

import { Connection } from '@solana/web3.js';
import { getRpcUrl } from '@/context/env';
import { fetchCourseStats } from '@/context/solana/course-service';
import { prisma } from '@/backend/prisma';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { WhitelistPanel } from '@/components/admin/WhitelistPanel';
import { ApiHealthPanel } from '@/components/admin/ApiHealthPanel';
import { startOfToday, ADMIN_ACTIVITY_LIMIT } from '@/backend/admin/utils';

export default async function AdminDashboard() {
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
        fetchCourseStats(connection).catch(() => ({
            totalCourses: 0,
            activeCourses: 0,
            totalEnrollments: 0,
            totalCompletions: 0,
            _rpcError: true,
        })),
        prisma.profiles.count({ where: { deleted_at: null } }),
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

    const serializedLogs = recentLogs.map((log) => ({
        ...log,
        created_at: log.created_at.toISOString(),
    }));

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 2px', color: '#e0e0e0', letterSpacing: '-0.02em' }}>
                    Dashboard
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                    Platform overview · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
            </div>

            {/* RPC Warning */}
            {'_rpcError' in courseStats && (
                <div
                    style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: '#1a1010',
                        border: '1px solid #3a2020',
                        marginBottom: '16px',
                        fontSize: '12px',
                        color: '#f87171',
                    }}
                >
                    Solana RPC unavailable — on-chain stats may be stale
                </div>
            )}

            {/* Stats Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '12px',
                    marginBottom: '24px',
                }}
            >
                <AdminStatsCard title="Total Users" value={totalUsers} />
                <AdminStatsCard title="Active Today" value={activeToday} />
                <AdminStatsCard title="Courses" value={courseStats.totalCourses} />
                <AdminStatsCard title="Active Courses" value={courseStats.activeCourses} />
                <AdminStatsCard title="Enrollments" value={courseStats.totalEnrollments} />
                <AdminStatsCard title="Completions" value={courseStats.totalCompletions} />
                <AdminStatsCard title="Achievements" value={totalAwards} />
                <AdminStatsCard title="Active Streaks" value={activeStreaks} />
            </div>

            {/* API Health */}
            <div style={{ marginBottom: '24px' }}>
                <ApiHealthPanel />
            </div>

            {/* Activity Feed */}
            <div
                style={{
                    background: '#111122',
                    border: '1px solid #1e1e30',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '24px',
                }}
            >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e30' }}>
                    <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#ccc' }}>Recent Activity</h2>
                </div>
                <ActivityFeed entries={serializedLogs} />
            </div>

            {/* Whitelist */}
            <WhitelistPanel />
        </div>
    );
}
