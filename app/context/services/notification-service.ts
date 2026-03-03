/**
 * Notification Service — triggers notifications for app events.
 *
 * Called by event handlers and user actions to create
 * notifications in the store + show toasts.
 *
 * This is a utility module, not a class — functions can be
 * called from any context that has access to the notification store.
 */

import type { NotificationType } from '@/context/stores/notificationStore';

export interface NotificationPayload {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
}

// ── Notification Factories ───────────────────────────────────────────

export function lessonCompletedNotification(
    courseName: string,
    lessonName: string,
    xpEarned: number
): NotificationPayload {
    return {
        type: 'lesson_complete',
        title: 'Lesson Completed!',
        message: `You earned ${xpEarned} XP in "${lessonName}"`,
        data: { courseName, lessonName, xpEarned },
    };
}

export function courseCompletedNotification(
    courseName: string,
    totalXp: number
): NotificationPayload {
    return {
        type: 'course_complete',
        title: 'Course Completed! 🎉',
        message: `Congratulations! You completed "${courseName}" and earned ${totalXp} XP`,
        data: { courseName, totalXp },
    };
}

export function achievementUnlockedNotification(
    name: string,
    xpReward: number
): NotificationPayload {
    return {
        type: 'achievement_unlock',
        title: 'Achievement Unlocked! 🏆',
        message: `You earned "${name}" (+${xpReward} XP)`,
        data: { achievementName: name, xpReward },
    };
}

export function credentialIssuedNotification(
    trackName: string
): NotificationPayload {
    return {
        type: 'credential_issued',
        title: 'Credential Issued! 📜',
        message: `Your ${trackName} credential has been minted to your wallet`,
        data: { trackName },
    };
}

export function streakMilestoneNotification(
    days: number
): NotificationPayload {
    return {
        type: 'streak_milestone',
        title: `${days} Day Streak! 🔥`,
        message: 'Amazing dedication! Keep up the great work!',
        data: { days },
    };
}

export function levelUpNotification(
    level: number,
    title: string
): NotificationPayload {
    return {
        type: 'level_up',
        title: `Level ${level} Reached! ⭐`,
        message: `You're now a ${title}!`,
        data: { level, title: title },
    };
}

export function replyNotification(
    authorName: string,
    threadTitle: string
): NotificationPayload {
    return {
        type: 'reply',
        title: 'New Reply',
        message: `${authorName} replied to "${threadTitle}"`,
        data: { authorName, threadTitle },
    };
}

export function mentionNotification(
    authorName: string,
    context: string
): NotificationPayload {
    return {
        type: 'mention',
        title: 'You were mentioned',
        message: `${authorName} mentioned you: "${context}"`,
        data: { authorName, context },
    };
}

export function systemNotification(
    title: string,
    message: string
): NotificationPayload {
    return {
        type: 'system',
        title,
        message,
    };
}

export function dailyLoginClaimNotification(
    xpAmount: number,
    streakDay: number
): NotificationPayload {
    return {
        type: 'daily_login_claim',
        title: `Daily Login +${xpAmount} XP`,
        message: `Day ${streakDay} streak bonus claimed!`,
        data: { xpAmount, streakDay },
    };
}
