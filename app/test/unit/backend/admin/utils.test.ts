import { describe, it, expect } from 'vitest';
import { ADMIN_PAGE_SIZE, ADMIN_ACTIVITY_LIMIT, startOfToday } from '@/backend/admin/utils';

describe('Admin utilities', () => {
    describe('constants', () => {
        it('ADMIN_PAGE_SIZE is 20', () => {
            expect(ADMIN_PAGE_SIZE).toBe(20);
        });

        it('ADMIN_ACTIVITY_LIMIT is 20', () => {
            expect(ADMIN_ACTIVITY_LIMIT).toBe(20);
        });
    });

    describe('startOfToday', () => {
        it('returns a Date object', () => {
            expect(startOfToday()).toBeInstanceOf(Date);
        });

        it('has hours, minutes, seconds, and ms set to 0', () => {
            const d = startOfToday();
            expect(d.getHours()).toBe(0);
            expect(d.getMinutes()).toBe(0);
            expect(d.getSeconds()).toBe(0);
            expect(d.getMilliseconds()).toBe(0);
        });

        it('has the current date', () => {
            const now = new Date();
            const today = startOfToday();
            expect(today.getFullYear()).toBe(now.getFullYear());
            expect(today.getMonth()).toBe(now.getMonth());
            expect(today.getDate()).toBe(now.getDate());
        });
    });
});
