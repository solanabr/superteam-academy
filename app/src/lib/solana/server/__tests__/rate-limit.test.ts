// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('checkRateLimit', () => {
  const WALLET_A = '7xKJaaaa1111';
  const WALLET_B = '9aBcbbbb2222';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-28T12:00:00Z'));
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', async () => {
    const { checkRateLimit } = await import('../rate-limit');

    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit(WALLET_A);
      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    }
  });

  it('blocks the 11th request within the window', async () => {
    const { checkRateLimit } = await import('../rate-limit');

    // Exhaust all 10 allowed requests
    for (let i = 0; i < 10; i++) {
      checkRateLimit(WALLET_A);
    }

    const blocked = checkRateLimit(WALLET_A);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeDefined();
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it('resets after the window expires', async () => {
    const { checkRateLimit } = await import('../rate-limit');

    // Exhaust all 10 allowed requests
    for (let i = 0; i < 10; i++) {
      checkRateLimit(WALLET_A);
    }

    // Confirm blocked
    expect(checkRateLimit(WALLET_A).allowed).toBe(false);

    // Advance time past the 60-second window
    vi.advanceTimersByTime(61_000);

    const result = checkRateLimit(WALLET_A);

    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBeUndefined();
  });

  it('tracks different wallets independently', async () => {
    const { checkRateLimit } = await import('../rate-limit');

    // Exhaust all 10 requests for wallet A
    for (let i = 0; i < 10; i++) {
      checkRateLimit(WALLET_A);
    }

    // Wallet A is blocked
    expect(checkRateLimit(WALLET_A).allowed).toBe(false);

    // Wallet B should still be allowed
    const resultB = checkRateLimit(WALLET_B);
    expect(resultB.allowed).toBe(true);
    expect(resultB.retryAfter).toBeUndefined();
  });
});
