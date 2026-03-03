/**
 * Admin dashboard page — server component.
 *
 * Displays platform stats from on-chain + Prisma data sources
 * and a recent activity feed from audit_logs.
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

    const serializedLogs = recentLogs.map((log) => ({
        ...log,
        created_at: log.created_at.toISOString(),
    }));

    return (
        <div>
            <div style={{ marginBottom: '32px' }}>
                <h1
                    style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        margin: '0 0 4px',
                        letterSpacing: '-0.02em',
                    }}
                >
                    Dashboard
                </h1>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                    Platform overview · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
            </div>

            {/* RPC Error Banner */}
            {'_rpcError' in courseStats && (
                <div
                    style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: 'rgba(248,113,113,0.1)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        marginBottom: '16px',
                        fontSize: '13px',
                        color: '#f87171',
                    }}
                >
                    Warning: Solana RPC unavailable — on-chain stats may be stale
                </div>
            )}

            {/* Stats Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px',
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
            <div
                style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '32px',
                    padding: '16px 20px',
                }}
            >
                <ApiHealthPanel />
            </div>

            {/* Admin Whitelist Management */}
            <WhitelistPanel />

            {/* Activity Feed */}
            <div
                style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '32px',
                    marginTop: '32px',
                }}
            >
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Recent Activity</h2>
                </div>
                <ActivityFeed entries={serializedLogs} />
            </div>
        </div>
    );
}
