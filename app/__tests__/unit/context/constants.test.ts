import { describe, it, expect } from 'vitest';
import {
    PAGE_SIZE_DEFAULT,
    PAGE_SIZE_MAX,
    THREAD_TITLE_MAX_LENGTH,
    THREAD_CONTENT_MAX_LENGTH,
    REPLY_MAX_LENGTH,
    THREAD_TAGS_MAX,
    MAX_NOTIFICATIONS,
    TOAST_AUTO_DISMISS_MS,
    QUEUE_MAX_ATTEMPTS,
    QUEUE_BACKOFF_BASE_MS,
    QUEUE_MAX_DEAD_LETTER,
    WEBHOOK_TIMEOUT_MS,
    LEADERBOARD_CACHE_TTL,
    TX_DEDUP_TTL,
    MAX_TX_HASH_CACHE,
    ACHIEVEMENT_IDS,
    COURSE_MILESTONES,
    SOFT_DELETE_RETENTION_DAYS,
} from '@/context/constants';

describe('Constants', () => {
    describe('Pagination', () => {
        it('PAGE_SIZE_DEFAULT is 20', () => {
            expect(PAGE_SIZE_DEFAULT).toBe(20);
        });

        it('PAGE_SIZE_MAX is 100', () => {
            expect(PAGE_SIZE_MAX).toBe(100);
        });

        it('default is less than max', () => {
            expect(PAGE_SIZE_DEFAULT).toBeLessThan(PAGE_SIZE_MAX);
        });
    });

    describe('Content Limits', () => {
        it('THREAD_TITLE_MAX_LENGTH is 255', () => {
            expect(THREAD_TITLE_MAX_LENGTH).toBe(255);
        });

        it('THREAD_CONTENT_MAX_LENGTH is 10000', () => {
            expect(THREAD_CONTENT_MAX_LENGTH).toBe(10_000);
        });

        it('REPLY_MAX_LENGTH is 5000', () => {
            expect(REPLY_MAX_LENGTH).toBe(5_000);
        });

        it('THREAD_TAGS_MAX is 5', () => {
            expect(THREAD_TAGS_MAX).toBe(5);
        });
    });

    describe('Notifications', () => {
        it('MAX_NOTIFICATIONS is 100', () => {
            expect(MAX_NOTIFICATIONS).toBe(100);
        });

        it('TOAST_AUTO_DISMISS_MS is 5000', () => {
            expect(TOAST_AUTO_DISMISS_MS).toBe(5_000);
        });
    });

    describe('Queue & Retry', () => {
        it('QUEUE_MAX_ATTEMPTS is 3', () => {
            expect(QUEUE_MAX_ATTEMPTS).toBe(3);
        });

        it('QUEUE_BACKOFF_BASE_MS is 1000', () => {
            expect(QUEUE_BACKOFF_BASE_MS).toBe(1_000);
        });

        it('QUEUE_MAX_DEAD_LETTER is 1000', () => {
            expect(QUEUE_MAX_DEAD_LETTER).toBe(1_000);
        });

        it('WEBHOOK_TIMEOUT_MS is 10000', () => {
            expect(WEBHOOK_TIMEOUT_MS).toBe(10_000);
        });
    });

    describe('Cache TTLs', () => {
        it('LEADERBOARD_CACHE_TTL is 1 hour (3600)', () => {
            expect(LEADERBOARD_CACHE_TTL).toBe(3_600);
        });

        it('TX_DEDUP_TTL is 24 hours (86400)', () => {
            expect(TX_DEDUP_TTL).toBe(86_400);
        });
    });

    describe('Event Listener', () => {
        it('MAX_TX_HASH_CACHE is 10000', () => {
            expect(MAX_TX_HASH_CACHE).toBe(10_000);
        });
    });

    describe('Achievement IDs', () => {
        it('has correct shape', () => {
            expect(ACHIEVEMENT_IDS).toHaveProperty('COURSE_COMPLETER');
            expect(ACHIEVEMENT_IDS).toHaveProperty('FIVE_COURSES');
            expect(ACHIEVEMENT_IDS).toHaveProperty('TEN_COURSES');
            expect(ACHIEVEMENT_IDS).toHaveProperty('FIRST_LESSON');
            expect(ACHIEVEMENT_IDS).toHaveProperty('STREAK_7');
            expect(ACHIEVEMENT_IDS).toHaveProperty('STREAK_30');
        });

        it('values are strings', () => {
            Object.values(ACHIEVEMENT_IDS).forEach(v => {
                expect(typeof v).toBe('string');
            });
        });
    });

    describe('Course Milestones', () => {
        it('has 3 milestones', () => {
            expect(COURSE_MILESTONES.length).toBe(3);
        });

        it('milestones are in ascending order', () => {
            for (let i = 1; i < COURSE_MILESTONES.length; i++) {
                expect(COURSE_MILESTONES[i].count).toBeGreaterThan(COURSE_MILESTONES[i - 1].count);
            }
        });
    });

    describe('GDPR', () => {
        it('SOFT_DELETE_RETENTION_DAYS is 30', () => {
            expect(SOFT_DELETE_RETENTION_DAYS).toBe(30);
        });
    });
});
