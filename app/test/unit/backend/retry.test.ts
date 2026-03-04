import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, isTransientError } from '@/backend/retry';

describe('withRetry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns result on first successful call', async () => {
        const fn = vi.fn().mockResolvedValue('success');
        const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 });
        expect(result).toBe('success');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error('fail1'))
            .mockRejectedValueOnce(new Error('fail2'))
            .mockResolvedValue('ok');

        const promise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 100 });
        await vi.runAllTimersAsync();
        const result = await promise;
        expect(result).toBe('ok');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('throws after exhausting retries', async () => {
        vi.useRealTimers(); // Use real timers to avoid unhandled rejection
        const fn = vi.fn().mockRejectedValue(new Error('always fails'));
        await expect(
            withRetry(fn, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 })
        ).rejects.toThrow('always fails');
        expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('respects shouldRetry predicate', async () => {
        vi.useRealTimers();
        const fn = vi.fn().mockRejectedValue(new Error('no retry'));
        await expect(
            withRetry(fn, {
                maxRetries: 3,
                baseDelayMs: 1,
                maxDelayMs: 5,
                shouldRetry: () => false,
            })
        ).rejects.toThrow('no retry');
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('isTransientError', () => {
    it('detects rate limiting (429)', () => {
        expect(isTransientError(new Error('HTTP 429 Too Many Requests'))).toBe(true);
    });

    it('detects service unavailable (503)', () => {
        expect(isTransientError(new Error('503 Service Unavailable'))).toBe(true);
    });

    it('detects bad gateway (502)', () => {
        expect(isTransientError(new Error('502 Bad Gateway'))).toBe(true);
    });

    it('detects timeout', () => {
        expect(isTransientError(new Error('Request timeout'))).toBe(true);
    });

    it('detects connection reset', () => {
        expect(isTransientError(new Error('ECONNRESET'))).toBe(true);
    });

    it('detects connection refused', () => {
        expect(isTransientError(new Error('ECONNREFUSED'))).toBe(true);
    });

    it('detects fetch failed', () => {
        expect(isTransientError(new Error('fetch failed'))).toBe(true);
    });

    it('detects Solana blockhash error', () => {
        expect(isTransientError(new Error('blockhash not found'))).toBe(true);
    });

    it('detects Solana node behind', () => {
        expect(isTransientError(new Error('node is behind'))).toBe(true);
    });

    it('returns false for non-transient errors', () => {
        expect(isTransientError(new Error('Invalid input'))).toBe(false);
    });

    it('returns false for non-Error values', () => {
        expect(isTransientError('string')).toBe(false);
        expect(isTransientError(null)).toBe(false);
        expect(isTransientError(42)).toBe(false);
    });
});
