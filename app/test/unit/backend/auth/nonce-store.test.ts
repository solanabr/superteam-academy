import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Nonce store (in-memory mode)', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
        // Clear Redis env so we use in-memory store
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('stores and retrieves a nonce', async () => {
        const { setNonce, getNonce } = await import('@/backend/auth/nonce-store');
        await setNonce('test-key', 'test-value');
        const result = await getNonce('test-key');
        expect(result).toBe('test-value');
    });

    it('getNonce consumes the nonce (one-time use)', async () => {
        const { setNonce, getNonce } = await import('@/backend/auth/nonce-store');
        await setNonce('consume-key', 'value');
        const first = await getNonce('consume-key');
        expect(first).toBe('value');
        // Second read should return null
        const second = await getNonce('consume-key');
        expect(second).toBeNull();
    });

    it('returns null for non-existent nonce', async () => {
        const { getNonce } = await import('@/backend/auth/nonce-store');
        const result = await getNonce('does-not-exist');
        expect(result).toBeNull();
    });

    it('deleteNonce removes the nonce', async () => {
        const { setNonce, deleteNonce, getNonce } = await import('@/backend/auth/nonce-store');
        await setNonce('del-key', 'val');
        await deleteNonce('del-key');
        const result = await getNonce('del-key');
        expect(result).toBeNull();
    });
});
