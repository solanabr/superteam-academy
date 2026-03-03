import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Lockout (in-memory mode)', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('isLockedOut returns false for unknown identifier', async () => {
        const { isLockedOut } = await import('@/backend/auth/lockout');
        expect(await isLockedOut('unknown-user')).toBe(false);
    });

    it('recordFailedAttempt returns false below threshold', async () => {
        const { recordFailedAttempt } = await import('@/backend/auth/lockout');
        const result = await recordFailedAttempt('test-user-1');
        expect(result).toBe(false);
    });

    it('lockout activates after 5 failed attempts', async () => {
        const { recordFailedAttempt, isLockedOut } = await import('@/backend/auth/lockout');
        const id = 'lockout-test-user';
        for (let i = 0; i < 4; i++) {
            const locked = await recordFailedAttempt(id);
            expect(locked).toBe(false);
        }
        // 5th attempt should trigger lockout
        const locked = await recordFailedAttempt(id);
        expect(locked).toBe(true);
        // Now isLockedOut should be true
        expect(await isLockedOut(id)).toBe(true);
    });

    it('clearFailedAttempts resets the lockout', async () => {
        const { recordFailedAttempt, clearFailedAttempts, isLockedOut } = await import('@/backend/auth/lockout');
        const id = 'clear-test-user';
        for (let i = 0; i < 5; i++) {
            await recordFailedAttempt(id);
        }
        expect(await isLockedOut(id)).toBe(true);
        await clearFailedAttempts(id);
        // After clearing, should no longer be locked out
        // Note: lockout store is keyed differently, so we test behavior
        expect(await isLockedOut(id)).toBe(false);
    });
});
