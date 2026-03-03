/**
 * Cron Jobs — scheduled tasks.
 *
 * Runs on configurable intervals:
 * - Leaderboard refresh (hourly) — cached to Redis
 * - Daily usage report (daily at midnight UTC)
 * - Stale session cleanup (every 6 hours)
 */

import { prisma } from '@/backend/prisma';
import { getRedisOptional } from '@/backend/redis';

// ── State ────────────────────────────────────────────────────────────

const intervals: ReturnType<typeof setInterval>[] = [];
let isRunning = false;

// ── Redis Keys ───────────────────────────────────────────────────────

const LEADERBOARD_KEY = 'cache:leaderboard';
const LEADERBOARD_TTL = 3600; // 1 hour

// ── Cron Functions ───────────────────────────────────────────────────

/**
 * Refresh leaderboard data — recalculates XP rankings.
 * Aggregates XP from streak_activity and caches to Redis.
 */
async function refreshLeaderboard(): Promise<void> {
    console.log('[Cron] Refreshing leaderboard...');
    const start = Date.now();

    try {
        // Aggregate total XP per user from streak_activity
        const leaderboard = await prisma.streak_activity.groupBy({
            by: ['user_id'],
            _sum: { xp_earned: true },
            orderBy: { _sum: { xp_earned: 'desc' } },
            take: 100,
        });

        // Enrich with profile data
        const userIds = leaderboard.map((e) => e.user_id);
        const profiles = await prisma.profiles.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, username: true, avatar_url: true },
        });
        const profileMap = new Map(profiles.map((p) => [p.id, p]));

        const enriched = leaderboard.map((entry, rank) => ({
            rank: rank + 1,
            userId: entry.user_id,
            totalXp: entry._sum.xp_earned ?? 0,
            name: profileMap.get(entry.user_id)?.name ?? null,
            username: profileMap.get(entry.user_id)?.username ?? null,
            avatarUrl: profileMap.get(entry.user_id)?.avatar_url ?? null,
        }));

        // Cache to Redis with TTL
        const redis = getRedisOptional();
        if (redis) {
            await redis.set(LEADERBOARD_KEY, JSON.stringify(enriched), { ex: LEADERBOARD_TTL });
        }

        console.log(
            `[Cron] Leaderboard refreshed: ${enriched.length} ranked users, ` +
            `top XP = ${enriched[0]?.totalXp ?? 0}, ` +
            `took ${Date.now() - start}ms`
        );
    } catch (error) {
        console.error('[Cron] Leaderboard refresh failed:', error);
    }
}

/**
 * Get cached leaderboard from Redis (or recompute if not cached).
 */
export async function getLeaderboard(): Promise<unknown[]> {
    const redis = getRedisOptional();
    if (redis) {
        const cached = await redis.get<string>(LEADERBOARD_KEY);
        if (cached) {
            return typeof cached === 'string' ? JSON.parse(cached) : cached;
        }
    }

    // Cache miss — refresh synchronously
    await refreshLeaderboard();

    if (redis) {
        const data = await redis.get<string>(LEADERBOARD_KEY);
        if (data) return typeof data === 'string' ? JSON.parse(data) : data;
    }
    return [];
}

/**
 * Generate daily usage report.
 */
async function generateDailyReport(): Promise<void> {
    console.log('[Cron] Generating daily report...');

    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [newUsers, eventCount, activeThreads] = await Promise.all([
            prisma.profiles.count({
                where: { created_at: { gte: oneDayAgo } },
            }),
            prisma.event_logs.count({
                where: { created_at: { gte: oneDayAgo } },
            }),
            prisma.threads.count({
                where: { created_at: { gte: oneDayAgo } },
            }),
        ]);

        console.log(`[Cron] Daily Report: ${newUsers} new users, ${eventCount} events, ${activeThreads} threads`);
    } catch (error) {
        console.error('[Cron] Daily report failed:', error);
    }
}

/**
 * Clean up stale sessions and expired data.
 */
async function cleanupStaleSessions(): Promise<void> {
    console.log('[Cron] Cleaning up stale sessions...');

    try {
        // Delete soft-deleted profiles older than 30 days (GDPR)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const deletedCount = await prisma.profiles.deleteMany({
            where: {
                deleted_at: { not: null, lt: thirtyDaysAgo },
            },
        });

        if (deletedCount.count > 0) {
            console.log(`[Cron] Purged ${deletedCount.count} soft-deleted profiles`);
        }
    } catch (error) {
        console.error('[Cron] Cleanup failed:', error);
    }
}

// ── Scheduler ────────────────────────────────────────────────────────

/**
 * Start all scheduled cron jobs.
 */
export function startCronJobs(): void {
    if (isRunning) {
        console.log('[Cron] Already running');
        return;
    }

    // Leaderboard refresh — every hour
    intervals.push(setInterval(refreshLeaderboard, 60 * 60 * 1000));

    // Daily report — every 24 hours
    intervals.push(setInterval(generateDailyReport, 24 * 60 * 60 * 1000));

    // Stale session cleanup — every 6 hours
    intervals.push(setInterval(cleanupStaleSessions, 6 * 60 * 60 * 1000));

    isRunning = true;
    console.log('[Cron] ✅ Started 3 cron jobs');

    // Run leaderboard immediately on startup
    refreshLeaderboard();
}

/**
 * Stop all cron jobs.
 */
export function stopCronJobs(): void {
    for (const interval of intervals) {
        clearInterval(interval);
    }
    intervals.length = 0;
    isRunning = false;
    console.log('[Cron] Stopped all cron jobs');
}

/**
 * Get cron status.
 */
export function getCronStatus(): { isRunning: boolean; jobCount: number } {
    return { isRunning, jobCount: intervals.length };
}
