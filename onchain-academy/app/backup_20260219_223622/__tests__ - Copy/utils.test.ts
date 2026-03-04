/**
 * __tests__/lib/utils.test.ts
 *
 * Unit tests for lib/utils.ts
 *
 * Coverage target: 100% of all exported functions
 * All tests are pure/deterministic — no network, no storage, no timers
 * (except formatRelativeTime which uses vi.useFakeTimers).
 *
 * Run: npm test -- utils
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  formatXP,
  calculateLevel,
  xpForNextLevel,
  levelProgress,
  truncateAddress,
  formatDuration,
  formatRelativeTime,
  isValidSolanaAddress,
  getDifficultyColor,
  getDifficultyVariant,
} from '@/lib/utils';

// ─── cn (className merger) ────────────────────────────────────────────────────

describe('cn', () => {
  it('merges two independent class names', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toContain('text-red-500');
    expect(cn('text-red-500', 'bg-blue-500')).toContain('bg-blue-500');
  });

  it('removes the earlier conflicting Tailwind class when both apply to the same property', () => {
    // tailwind-merge: last one wins for the same property
    const result = cn('px-2', 'px-4');
    expect(result).not.toContain('px-2');
    expect(result).toContain('px-4');
  });

  it('includes a truthy conditional class and excludes a falsy one', () => {
    const result = cn('base', true && 'active', false && 'inactive');
    expect(result).toContain('base');
    expect(result).toContain('active');
    expect(result).not.toContain('inactive');
  });

  it('handles an undefined argument without throwing', () => {
    expect(() => cn('foo', undefined as unknown as string)).not.toThrow();
  });

  it('returns an empty string when no arguments are provided', () => {
    expect(cn()).toBe('');
  });

  it('handles an array of class names', () => {
    const result = cn(['text-sm', 'font-bold']);
    expect(result).toContain('text-sm');
    expect(result).toContain('font-bold');
  });

  it('deduplicates identical class names', () => {
    const result = cn('text-sm', 'text-sm');
    // Should appear once
    expect(result.split('text-sm').length - 1).toBe(1);
  });
});

// ─── formatXP ─────────────────────────────────────────────────────────────────

describe('formatXP', () => {
  it('formats zero as "0"', () => {
    expect(formatXP(0)).toBe('0');
  });

  it('formats sub-thousand numbers without separator', () => {
    expect(formatXP(999)).toBe('999');
    expect(formatXP(1)).toBe('1');
    expect(formatXP(100)).toBe('100');
  });

  it('formats exactly 1 000 with a comma separator', () => {
    expect(formatXP(1000)).toBe('1,000');
  });

  it('formats five-digit numbers correctly', () => {
    expect(formatXP(10000)).toBe('10,000');
    expect(formatXP(12345)).toBe('12,345');
  });

  it('formats one million correctly', () => {
    expect(formatXP(1000000)).toBe('1,000,000');
  });
});

// ─── calculateLevel ───────────────────────────────────────────────────────────
// Formula: floor(sqrt(max(0, xp) / 100))

describe('calculateLevel', () => {
  it('returns level 0 for 0 XP', () => {
    expect(calculateLevel(0)).toBe(0);
  });

  it('returns level 0 for 99 XP (just below level 1 threshold)', () => {
    expect(calculateLevel(99)).toBe(0);
  });

  it('returns level 1 for exactly 100 XP (level 1 threshold)', () => {
    expect(calculateLevel(100)).toBe(1);
  });

  it('returns level 1 for 399 XP (just below level 2)', () => {
    expect(calculateLevel(399)).toBe(1);
  });

  it('returns level 2 for exactly 400 XP', () => {
    expect(calculateLevel(400)).toBe(2);
  });

  it('returns level 3 for exactly 900 XP', () => {
    expect(calculateLevel(900)).toBe(3);
  });

  it('returns level 5 for 2 500 XP (sqrt(25) = 5)', () => {
    expect(calculateLevel(2500)).toBe(5);
  });

  it('returns level 10 for 10 000 XP (sqrt(100) = 10)', () => {
    expect(calculateLevel(10000)).toBe(10);
  });

  it('clamps negative XP to 0 and returns level 0', () => {
    expect(calculateLevel(-1)).toBe(0);
    expect(calculateLevel(-9999)).toBe(0);
  });

  it('handles extremely large XP without throwing', () => {
    expect(() => calculateLevel(Number.MAX_SAFE_INTEGER)).not.toThrow();
    expect(calculateLevel(Number.MAX_SAFE_INTEGER)).toBeGreaterThan(0);
  });

  // Boundary table — exact level thresholds
  const THRESHOLDS: Array<[number, number, number]> = [
    // [xpAtBoundary, expectedLevel, xpOneLess]
    [100,   1, 99],
    [400,   2, 399],
    [900,   3, 899],
    [1600,  4, 1599],
    [2500,  5, 2499],
    [3600,  6, 3599],
    [4900,  7, 4899],
    [6400,  8, 6399],
    [8100,  9, 8099],
    [10000, 10, 9999],
  ];

  it.each(THRESHOLDS)(
    'crosses level boundary correctly at %i XP → level %i',
    (threshold, level, below) => {
      expect(calculateLevel(threshold)).toBe(level);
      expect(calculateLevel(below)).toBe(level - 1);
    }
  );
});

// ─── xpForNextLevel ───────────────────────────────────────────────────────────
// Formula: (level + 1)^2 * 100

describe('xpForNextLevel', () => {
  it('returns 100 XP needed to reach level 1 from level 0', () => {
    expect(xpForNextLevel(0)).toBe(100);
  });

  it('returns 400 XP for level 1 → 2', () => {
    expect(xpForNextLevel(1)).toBe(400);
  });

  it('returns 900 XP for level 2 → 3', () => {
    expect(xpForNextLevel(2)).toBe(900);
  });

  it('returns 3 600 XP for level 5 → 6', () => {
    expect(xpForNextLevel(5)).toBe(3600);
  });

  it('is consistent with calculateLevel: xpForNextLevel(n) is the level-(n+1) threshold', () => {
    for (let l = 0; l <= 9; l++) {
      expect(calculateLevel(xpForNextLevel(l))).toBe(l + 1);
    }
  });
});

// ─── levelProgress ────────────────────────────────────────────────────────────

describe('levelProgress', () => {
  it('returns 0 at the start of level 0 (0 XP)', () => {
    expect(levelProgress(0)).toBe(0);
  });

  it('returns 0 at the exact level-1 threshold (100 XP)', () => {
    expect(levelProgress(100)).toBe(0);
  });

  it('returns 0 at the exact level-2 threshold (400 XP)', () => {
    expect(levelProgress(400)).toBe(0);
  });

  it('returns 50% at the midpoint of level 0 (50 XP out of 100)', () => {
    expect(levelProgress(50)).toBe(50);
  });

  it('returns 50% at the midpoint of level 1 (250 XP: 100 base + 150 of 300)', () => {
    // Level 1: 100–399 XP, range = 300. Midpoint = 100 + 150 = 250 XP
    expect(levelProgress(250)).toBe(50);
  });

  it('returns 99% just before the level-1 boundary (99 XP out of 100)', () => {
    expect(levelProgress(99)).toBe(99);
  });

  it('never exceeds 100 for very large XP values', () => {
    expect(levelProgress(Number.MAX_SAFE_INTEGER)).toBeLessThanOrEqual(100);
  });

  it('handles negative XP gracefully (clamps to 0)', () => {
    expect(levelProgress(-1)).toBeGreaterThanOrEqual(0);
    expect(levelProgress(-1)).toBeLessThanOrEqual(100);
  });
});

// ─── truncateAddress ─────────────────────────────────────────────────────────

describe('truncateAddress', () => {
  const LONG_ADDR = 'AbCdEfGhIjKlMnOpQrStUvWxYz123456789abcdef';

  it('truncates a long address to "XXXX...XXXX" with the default 4-char cutoff', () => {
    expect(truncateAddress(LONG_ADDR)).toBe(`${LONG_ADDR.slice(0, 4)}...${LONG_ADDR.slice(-4)}`);
  });

  it('respects a custom char count', () => {
    const result = truncateAddress(LONG_ADDR, 6);
    expect(result).toBe(`${LONG_ADDR.slice(0, 6)}...${LONG_ADDR.slice(-6)}`);
  });

  it('returns the address unchanged when it is exactly chars*2 characters long', () => {
    const addr8 = '12345678'; // exactly 4*2 = 8 chars
    expect(truncateAddress(addr8, 4)).toBe(addr8);
  });

  it('returns the address unchanged when it is shorter than chars*2', () => {
    expect(truncateAddress('Short', 4)).toBe('Short');
  });

  it('returns an empty string when given an empty string', () => {
    expect(truncateAddress('')).toBe('');
  });

  it('handles a 1-character address without truncating', () => {
    expect(truncateAddress('A')).toBe('A');
  });

  it('returns the original string when chars is 0 (edge: 0*2 = 0, always ≤ length)', () => {
    // address.length (> 0) > 0 * 2 (= 0), so it always truncates with chars=0
    const result = truncateAddress('ABCDEF', 0);
    expect(result).toBe('...');
  });
});

// ─── formatDuration ───────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats 0 minutes as "0m"', () => {
    expect(formatDuration(0)).toBe('0m');
  });

  it('formats 45 minutes as "45m"', () => {
    expect(formatDuration(45)).toBe('45m');
  });

  it('formats 59 minutes as "59m" (just below 1h)', () => {
    expect(formatDuration(59)).toBe('59m');
  });

  it('formats exactly 60 minutes as "1h"', () => {
    expect(formatDuration(60)).toBe('1h');
  });

  it('formats 90 minutes as "1h 30m"', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('formats 120 minutes as "2h" (no trailing zero minutes)', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formats 61 minutes as "1h 1m"', () => {
    expect(formatDuration(61)).toBe('1h 1m');
  });

  it('formats 125 minutes as "2h 5m"', () => {
    expect(formatDuration(125)).toBe('2h 5m');
  });

  it('formats 1 440 minutes (24h) as "24h"', () => {
    expect(formatDuration(1440)).toBe('24h');
  });
});

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  const NOW = new Date('2024-06-01T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for the current timestamp', () => {
    expect(formatRelativeTime(NOW.toISOString())).toBe('just now');
  });

  it('returns "just now" for a timestamp 30 seconds ago', () => {
    const thirtySecsAgo = new Date(NOW.getTime() - 30_000);
    expect(formatRelativeTime(thirtySecsAgo)).toBe('just now');
  });

  it('returns "1 minute ago" for exactly 60 seconds ago', () => {
    const oneMinAgo = new Date(NOW.getTime() - 60_000);
    expect(formatRelativeTime(oneMinAgo)).toBe('1 minute ago');
  });

  it('returns "5 minutes ago" for 5 minutes ago', () => {
    const fiveMinAgo = new Date(NOW.getTime() - 5 * 60_000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 minutes ago');
  });

  it('returns "1 hour ago" for exactly 60 minutes ago', () => {
    const oneHourAgo = new Date(NOW.getTime() - 60 * 60_000);
    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
  });

  it('returns "3 hours ago" for 3 hours ago', () => {
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 60 * 60_000);
    expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
  });

  it('returns "1 day ago" for exactly 24 hours ago', () => {
    const oneDayAgo = new Date(NOW.getTime() - 24 * 60 * 60_000);
    expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');
  });

  it('returns "7 days ago" for one week ago', () => {
    const oneWeekAgo = new Date(NOW.getTime() - 7 * 24 * 60 * 60_000);
    expect(formatRelativeTime(oneWeekAgo)).toBe('7 days ago');
  });

  it('accepts a Date object as well as an ISO string', () => {
    const date = new Date(NOW.getTime() - 60_000);
    expect(formatRelativeTime(date)).toBe('1 minute ago');
  });

  it('uses singular "minute" for exactly 1 minute', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 60_001))).toBe('1 minute ago');
  });

  it('uses plural "minutes" for 2 minutes', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 120_000))).toBe('2 minutes ago');
  });

  it('uses singular "hour" for exactly 1 hour', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 3_600_000))).toBe('1 hour ago');
  });

  it('uses singular "day" for exactly 1 day', () => {
    expect(formatRelativeTime(new Date(NOW.getTime() - 86_400_000))).toBe('1 day ago');
  });
});

// ─── isValidSolanaAddress ─────────────────────────────────────────────────────
// Regex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
// Note: excludes 0, I, O, l (ambiguous in base58)

describe('isValidSolanaAddress', () => {
  // Real-world valid addresses
  const VALID_ADDRESSES = [
    'So11111111111111111111111111111111111111112',  // SOL mint (44 chars)
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint
    '11111111111111111111111111111111',             // System Program (32 chars)
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
  ];

  it.each(VALID_ADDRESSES)('accepts valid Solana address: %s', (addr) => {
    expect(isValidSolanaAddress(addr)).toBe(true);
  });

  it('accepts a 32-character valid address (minimum length)', () => {
    expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true);
  });

  it('accepts a 44-character valid address (maximum length)', () => {
    expect(isValidSolanaAddress('So11111111111111111111111111111111111111112')).toBe(true);
  });

  it('rejects an address shorter than 32 characters', () => {
    expect(isValidSolanaAddress('1234567890123456789012345678901')).toBe(false); // 31 chars
  });

  it('rejects an address longer than 44 characters', () => {
    expect(isValidSolanaAddress('1'.repeat(45))).toBe(false);
  });

  it('rejects an address containing "0" (invalid base58 character)', () => {
    expect(isValidSolanaAddress('0'.repeat(32))).toBe(false);
  });

  it('rejects an address containing "I" (invalid base58 character)', () => {
    expect(isValidSolanaAddress('I' + '1'.repeat(31))).toBe(false);
  });

  it('rejects an address containing "O" (invalid base58 character)', () => {
    expect(isValidSolanaAddress('O' + '1'.repeat(31))).toBe(false);
  });

  it('rejects an address containing "l" (invalid base58 lowercase-l)', () => {
    expect(isValidSolanaAddress('l' + '1'.repeat(31))).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidSolanaAddress('')).toBe(false);
  });

  it('rejects an address with spaces', () => {
    expect(isValidSolanaAddress(' ' + '1'.repeat(32))).toBe(false);
  });

  it('rejects an address with special characters', () => {
    expect(isValidSolanaAddress('!@#$%^&*()' + '1'.repeat(22))).toBe(false);
  });
});

// ─── getDifficultyColor ───────────────────────────────────────────────────────

describe('getDifficultyColor', () => {
  it('returns text-green-500 for "beginner"', () => {
    expect(getDifficultyColor('beginner')).toBe('text-green-500');
  });

  it('returns text-yellow-500 for "intermediate"', () => {
    expect(getDifficultyColor('intermediate')).toBe('text-yellow-500');
  });

  it('returns text-red-500 for "advanced"', () => {
    expect(getDifficultyColor('advanced')).toBe('text-red-500');
  });

  it('is case-insensitive (BEGINNER → green)', () => {
    expect(getDifficultyColor('BEGINNER')).toBe('text-green-500');
  });

  it('is case-insensitive (Advanced → red)', () => {
    expect(getDifficultyColor('Advanced')).toBe('text-red-500');
  });

  it('returns text-gray-500 for an unknown difficulty', () => {
    expect(getDifficultyColor('expert')).toBe('text-gray-500');
    expect(getDifficultyColor('')).toBe('text-gray-500');
  });
});

// ─── getDifficultyVariant ─────────────────────────────────────────────────────

describe('getDifficultyVariant', () => {
  it('returns "success" for "beginner"', () => {
    expect(getDifficultyVariant('beginner')).toBe('success');
  });

  it('returns "warning" for "intermediate"', () => {
    expect(getDifficultyVariant('intermediate')).toBe('warning');
  });

  it('returns "destructive" for "advanced"', () => {
    expect(getDifficultyVariant('advanced')).toBe('destructive');
  });

  it('is case-insensitive', () => {
    expect(getDifficultyVariant('INTERMEDIATE')).toBe('warning');
  });

  it('returns "default" for an unrecognised difficulty', () => {
    expect(getDifficultyVariant('unknown')).toBe('default');
    expect(getDifficultyVariant('')).toBe('default');
  });
});
