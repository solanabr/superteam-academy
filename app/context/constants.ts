/**
 * Application-wide constants.
 *
 * Centralizes magic numbers and configuration values
 * to make them easily discoverable and maintainable.
 */

// ── Pagination ───────────────────────────────────────────────────────

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 100;

// ── Content Limits ───────────────────────────────────────────────────

export const THREAD_TITLE_MAX_LENGTH = 255;
export const THREAD_CONTENT_MAX_LENGTH = 10_000;
export const REPLY_MAX_LENGTH = 5_000;
export const THREAD_TAGS_MAX = 5;

// ── Notifications ────────────────────────────────────────────────────

export const MAX_NOTIFICATIONS = 100;
export const TOAST_AUTO_DISMISS_MS = 5_000;

// ── Queue & Retry ────────────────────────────────────────────────────

export const QUEUE_MAX_ATTEMPTS = 3;
export const QUEUE_BACKOFF_BASE_MS = 1_000;
export const QUEUE_MAX_DEAD_LETTER = 1_000;
export const WEBHOOK_TIMEOUT_MS = 10_000;

// ── Cache TTLs (seconds) ────────────────────────────────────────────

export const LEADERBOARD_CACHE_TTL = 3_600; // 1 hour
export const TX_DEDUP_TTL = 86_400; // 24 hours

// ── Event Listener ───────────────────────────────────────────────────

export const MAX_TX_HASH_CACHE = 10_000;

// ── Achievements ─────────────────────────────────────────────────────

export const ACHIEVEMENT_IDS = {
    COURSE_COMPLETER: 'course-completer',
    FIVE_COURSES: 'five-courses',
    TEN_COURSES: 'ten-courses',
    FIRST_LESSON: 'first-lesson',
    STREAK_7: 'streak-7',
    STREAK_30: 'streak-30',
} as const;

export const COURSE_MILESTONES = [
    { count: 1, id: ACHIEVEMENT_IDS.COURSE_COMPLETER },
    { count: 5, id: ACHIEVEMENT_IDS.FIVE_COURSES },
    { count: 10, id: ACHIEVEMENT_IDS.TEN_COURSES },
] as const;

// ── GDPR / Cleanup ───────────────────────────────────────────────────

export const SOFT_DELETE_RETENTION_DAYS = 30;
