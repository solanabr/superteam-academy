import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Environment validation', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    describe('getRequiredEnv', () => {
        it('returns the value when env var is set', async () => {
            process.env.TEST_KEY = 'test-value';
            const { getRequiredEnv } = await import('@/context/env');
            expect(getRequiredEnv('TEST_KEY')).toBe('test-value');
        });

        it('returns devFallback when env var is not set in non-production', async () => {
            delete process.env.MY_MISSING_VAR;
            // @ts-expect-error — NODE_ENV is typed as read-only but we need to override for tests
            process.env.NODE_ENV = 'test';
            const { getRequiredEnv } = await import('@/context/env');
            expect(getRequiredEnv('MY_MISSING_VAR', 'fallback')).toBe('fallback');
        });

        it('throws in production when env var is missing', async () => {
            delete process.env.MY_MISSING_VAR;
            // @ts-expect-error — NODE_ENV is typed as read-only but we need to override for tests
            process.env.NODE_ENV = 'production';
            const { getRequiredEnv } = await import('@/context/env');
            expect(() => getRequiredEnv('MY_MISSING_VAR')).toThrow('Missing required environment variable');
        });
    });

    describe('safeErrorDetails', () => {
        it('returns error message in development', async () => {
            // @ts-expect-error — NODE_ENV is typed as read-only but we need to override for tests
            process.env.NODE_ENV = 'development';
            const { safeErrorDetails } = await import('@/context/env');
            expect(safeErrorDetails(new Error('debug info'))).toBe('debug info');
        });

        it('returns undefined in production', async () => {
            // @ts-expect-error — NODE_ENV is typed as read-only but we need to override for tests
            process.env.NODE_ENV = 'production';
            const { safeErrorDetails } = await import('@/context/env');
            expect(safeErrorDetails(new Error('secret'))).toBeUndefined();
        });

        it('converts non-Error to string in development', async () => {
            // @ts-expect-error — NODE_ENV is typed as read-only but we need to override for tests
            process.env.NODE_ENV = 'development';
            const { safeErrorDetails } = await import('@/context/env');
            expect(safeErrorDetails('string error')).toBe('string error');
        });
    });

    describe('getRpcUrl', () => {
        it('returns configured RPC URL when set', async () => {
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL = 'https://my-rpc.example.com';
            const { getRpcUrl } = await import('@/context/env');
            expect(getRpcUrl()).toBe('https://my-rpc.example.com');
        });

        it('returns devnet fallback when not set in dev', async () => {
            delete process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
            // @ts-expect-error — NODE_ENV is typed as read-only but we need to override for tests
            process.env.NODE_ENV = 'test';
            const { getRpcUrl } = await import('@/context/env');
            expect(getRpcUrl()).toBe('https://api.devnet.solana.com');
        });
    });
});
