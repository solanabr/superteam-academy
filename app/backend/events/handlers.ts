/**
 * Event handlers for on-chain program events.
 *
 * Each handler processes an event and updates the appropriate caches,
 * database records, and leaderboard. Handlers are fire-and-forget —
 * failures are logged but don't block the event listener.
 */

import type {
    EventPayload,
    LessonCompletedEvent,
    CourseFinalizedEvent,
    CredentialIssuedEvent,
    CredentialUpgradedEvent,
    AchievementAwardedEvent,
    EnrolledEvent,
    EnrollmentClosedEvent,
    XpRewardedEvent,
    CourseCreatedEvent,
} from './types';
import { prisma } from '@/backend/prisma';
import type { Prisma } from '@prisma/client';
import { COURSE_MILESTONES } from '@/context/constants';
import { enqueue } from '@/backend/queue/queue-service';
import { getRedisOptional } from '@/backend/redis';

const LEADERBOARD_KEY = 'cache:leaderboard';

/** Queue a push notification for a user. */
async function queueNotification(userId: string, title: string, body: string, url?: string): Promise<void> {
    await enqueue('notification.push', { userId, title, body, url });
}

// ── Individual Handlers ──────────────────────────────────────────────

async function handleEnrolled(data: EnrolledEvent, txHash: string): Promise<void> {
    console.log(`[Event] Enrolled: learner=${data.learner} course=${data.course} tx=${txHash}`);
    // Find user by wallet address and log enrollment
    const linked = await prisma.linked_accounts.findFirst({
        where: { provider: 'wallet', provider_id: data.learner },
        select: { user_id: true },
    });
    if (linked) {
        await prisma.audit_logs.create({
            data: { user_id: linked.user_id, action: 'course_enrolled', metadata: { courseId: data.course, txHash } as unknown as Prisma.InputJsonValue },
        });
        await queueNotification(linked.user_id, 'Enrolled!', `You enrolled in course ${data.course}`, '/dashboard');
    }
}

async function handleLessonCompleted(data: LessonCompletedEvent, txHash: string): Promise<void> {
    console.log(`[Event] LessonCompleted: learner=${data.learner} lesson=${data.lessonIndex} xp=${data.xpEarned} tx=${txHash}`);
    const linked = await prisma.linked_accounts.findFirst({
        where: { provider: 'wallet', provider_id: data.learner },
        select: { user_id: true },
    });
    if (!linked) return;

    // Record streak activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.streak_activity.upsert({
        where: { user_id_activity_date: { user_id: linked.user_id, activity_date: today } },
        update: { xp_earned: { increment: data.xpEarned }, lessons_completed: { increment: 1 } },
        create: { user_id: linked.user_id, activity_date: today, xp_earned: data.xpEarned, lessons_completed: 1, courses_completed: 0 },
    });

    // Notify + invalidate leaderboard
    await queueNotification(linked.user_id, 'Lesson Completed!', `You earned ${data.xpEarned} XP`, '/dashboard');
    const redis = getRedisOptional();
    if (redis) await redis.del(LEADERBOARD_KEY);
}

async function handleCourseFinalized(data: CourseFinalizedEvent, txHash: string): Promise<void> {
    console.log(`[Event] CourseFinalized: learner=${data.learner} totalXp=${data.totalXp} bonusXp=${data.bonusXp} tx=${txHash}`);
    const linked = await prisma.linked_accounts.findFirst({
        where: { provider: 'wallet', provider_id: data.learner },
        select: { user_id: true },
    });
    if (!linked) return;

    // Record course completion in streak activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.streak_activity.upsert({
        where: { user_id_activity_date: { user_id: linked.user_id, activity_date: today } },
        update: { xp_earned: { increment: data.totalXp + data.bonusXp }, courses_completed: { increment: 1 } },
        create: { user_id: linked.user_id, activity_date: today, xp_earned: data.totalXp + data.bonusXp, lessons_completed: 0, courses_completed: 1 },
    });

    // Check achievement eligibility: course-completer
    const totalCourses = await prisma.streak_activity.aggregate({
        where: { user_id: linked.user_id },
        _sum: { courses_completed: true },
    });
    const count = totalCourses._sum.courses_completed ?? 0;
    for (const m of COURSE_MILESTONES) {
        if (count >= m.count) {
            try {
                await prisma.achievements.create({
                    data: { user_id: linked.user_id, achievement_id: m.id, awarded_at: new Date() },
                });
                await queueNotification(linked.user_id, 'Achievement Unlocked! 🏆', `You completed ${m.count} course(s)!`, '/profile');
            } catch { /* unique constraint — already awarded */ }
        }
    }

    // Notify + invalidate leaderboard
    await queueNotification(linked.user_id, 'Course Completed! 🎉', `You earned ${data.totalXp + data.bonusXp} XP`, '/dashboard');
    const redis = getRedisOptional();
    if (redis) await redis.del(LEADERBOARD_KEY);
}

async function handleEnrollmentClosed(data: EnrollmentClosedEvent, txHash: string): Promise<void> {
    console.log(`[Event] EnrollmentClosed: learner=${data.learner} completed=${data.completed} rent=${data.rentReclaimed} tx=${txHash}`);
    // Log only — enrollment close is informational
}

async function handleCredentialIssued(data: CredentialIssuedEvent, txHash: string): Promise<void> {
    console.log(`[Event] CredentialIssued: learner=${data.learner} track=${data.trackId} asset=${data.credentialAsset} tx=${txHash}`);
    const linked = await prisma.linked_accounts.findFirst({
        where: { provider: 'wallet', provider_id: data.learner },
        select: { user_id: true },
    });
    if (!linked) return;

    // Record credential achievement
    try {
        await prisma.achievements.create({
            data: {
                user_id: linked.user_id,
                achievement_id: `credential-${data.trackId}`,
                asset_address: data.credentialAsset,
                awarded_at: new Date(),
            },
        });
    } catch { /* unique constraint — already recorded */ }

    await queueNotification(linked.user_id, 'Credential Issued! 📜', `Your credential for track ${data.trackId} has been minted`, '/profile');
}

async function handleCredentialUpgraded(data: CredentialUpgradedEvent, txHash: string): Promise<void> {
    console.log(`[Event] CredentialUpgraded: learner=${data.learner} track=${data.trackId} level=${data.currentLevel} tx=${txHash}`);
    // Update existing credential record level — informational log
}

async function handleXpRewarded(data: XpRewardedEvent, txHash: string): Promise<void> {
    console.log(`[Event] XpRewarded: recipient=${data.recipient} amount=${data.amount} minter=${data.minter} tx=${txHash}`);
    const linked = await prisma.linked_accounts.findFirst({
        where: { provider: 'wallet', provider_id: data.recipient },
        select: { user_id: true },
    });
    if (!linked) return;

    // Record XP in today's streak activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.streak_activity.upsert({
        where: { user_id_activity_date: { user_id: linked.user_id, activity_date: today } },
        update: { xp_earned: { increment: data.amount } },
        create: { user_id: linked.user_id, activity_date: today, xp_earned: data.amount, lessons_completed: 0, courses_completed: 0 },
    });

    // Invalidate leaderboard cache on XP change
    const redis = getRedisOptional();
    if (redis) await redis.del(LEADERBOARD_KEY);
}

async function handleAchievementAwarded(data: AchievementAwardedEvent, txHash: string): Promise<void> {
    console.log(`[Event] AchievementAwarded: recipient=${data.recipient} achievement=${data.achievementId} xp=${data.xpReward} tx=${txHash}`);
    const linked = await prisma.linked_accounts.findFirst({
        where: { provider: 'wallet', provider_id: data.recipient },
        select: { user_id: true },
    });
    if (!linked) return;

    // Record achievement in DB
    try {
        await prisma.achievements.create({
            data: { user_id: linked.user_id, achievement_id: data.achievementId, awarded_at: new Date() },
        });
    } catch { /* unique constraint — already awarded */ }

    await queueNotification(linked.user_id, 'Achievement Unlocked! 🏆', `Achievement: ${data.achievementId}`, '/profile');
}

async function handleCourseCreated(data: CourseCreatedEvent, txHash: string): Promise<void> {
    console.log(`[Event] CourseCreated: courseId=${data.courseId} creator=${data.creator} tx=${txHash}`);
    // Informational log — course data is read from on-chain state
}

// ── Main Dispatcher ──────────────────────────────────────────────────

/**
 * Dispatch an event to the appropriate handler and log it to the DB.
 * Errors are caught and logged — they never propagate up.
 */
export async function dispatchEvent(
    event: EventPayload,
    txHash: string,
    slot: number
): Promise<void> {
    try {
        // 1. Log to database
        await prisma.event_logs.create({
            data: {
                event_type: event.name,
                tx_hash: txHash,
                slot,
                timestamp: new Date(('timestamp' in event.data ? (event.data as { timestamp: number }).timestamp : 0) * 1000),
                data: event.data as unknown as Prisma.InputJsonValue,
                processed: true,
            },
        });

        // 2. Dispatch to handler
        switch (event.name) {
            case 'Enrolled':
                await handleEnrolled(event.data, txHash);
                break;
            case 'LessonCompleted':
                await handleLessonCompleted(event.data, txHash);
                break;
            case 'CourseFinalized':
                await handleCourseFinalized(event.data, txHash);
                break;
            case 'EnrollmentClosed':
                await handleEnrollmentClosed(event.data, txHash);
                break;
            case 'CredentialIssued':
                await handleCredentialIssued(event.data, txHash);
                break;
            case 'CredentialUpgraded':
                await handleCredentialUpgraded(event.data, txHash);
                break;
            case 'XpRewarded':
                await handleXpRewarded(event.data, txHash);
                break;
            case 'AchievementAwarded':
                await handleAchievementAwarded(event.data, txHash);
                break;
            case 'CourseCreated':
                await handleCourseCreated(event.data, txHash);
                break;
            // Admin/config events — log only, no side effects
            case 'ConfigUpdated':
            case 'CourseUpdated':
            case 'MinterRegistered':
            case 'MinterRevoked':
            case 'AchievementTypeCreated':
            case 'AchievementTypeDeactivated':
                console.log(`[Event] ${event.name}: tx=${txHash}`);
                break;
        }
    } catch (error) {
        // Fire-and-forget: log but don't crash the listener
        console.error(`[EventHandler] Failed to process ${event.name} from tx ${txHash}:`, error);

        // Try to log the failure
        try {
            await prisma.event_logs.create({
                data: {
                    event_type: event.name,
                    tx_hash: txHash,
                    slot,
                    timestamp: new Date(),
                    data: event.data as unknown as Prisma.InputJsonValue,
                    processed: false,
                },
            });
        } catch {
            // Last resort — even logging failed
            console.error(`[EventHandler] Failed to persist error log for tx ${txHash}`);
        }
    }
}
