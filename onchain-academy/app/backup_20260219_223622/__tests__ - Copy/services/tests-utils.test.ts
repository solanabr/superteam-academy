// __tests__/utils.test.ts

/**
 * UTILITY FUNCTIONS TESTS
 * 
 * Tests all utility functions for correctness
 */

import { describe, it, expect } from 'vitest';
import {
  cn,
  formatXP,
  calculateLevel,
  xpForNextLevel,
  levelProgress,
  truncateAddress,
  formatDuration,
  isValidSolanaAddress,
  getDifficultyColor,
  getDifficultyVariant,
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'active', false && 'inactive');
      expect(result).toContain('base');
      expect(result).toContain('active');
      expect(result).not.toContain('inactive');
    });

    it('should handle Tailwind conflicts', () => {
      const result = cn('px-2', 'px-4');
      // Should only keep px-4 (last one wins)
      expect(result).not.toContain('px-2');
      expect(result).toContain('px-4');
    });
  });

  describe('formatXP', () => {
    it('should format small numbers without separator', () => {
      expect(formatXP(0)).toBe('0');
      expect(formatXP(100)).toBe('100');
      expect(formatXP(999)).toBe('999');
    });

    it('should format large numbers with thousand separator', () => {
      expect(formatXP(1000)).toBe('1,000');
      expect(formatXP(1234)).toBe('1,234');
      expect(formatXP(10000)).toBe('10,000');
      expect(formatXP(1000000)).toBe('1,000,000');
    });
  });

  describe('calculateLevel', () => {
    it('should return level 1 for 0-99 XP', () => {
      expect(calculateLevel(0)).toBe(0);
      expect(calculateLevel(50)).toBe(0);
      expect(calculateLevel(99)).toBe(0);
    });

    it('should return level 2 for 100-399 XP', () => {
      expect(calculateLevel(100)).toBe(1);
      expect(calculateLevel(200)).toBe(1);
      expect(calculateLevel(399)).toBe(1);
    });

    it('should return level 3 for 400-899 XP', () => {
      expect(calculateLevel(400)).toBe(2);
      expect(calculateLevel(500)).toBe(2);
      expect(calculateLevel(899)).toBe(2);
    });

    it('should use square root formula correctly', () => {
      // Level = floor(sqrt(xp/100))
      expect(calculateLevel(2500)).toBe(5); // sqrt(25) = 5
      expect(calculateLevel(10000)).toBe(10); // sqrt(100) = 10
    });
  });

  describe('xpForNextLevel', () => {
    it('should calculate XP needed for next level', () => {
      expect(xpForNextLevel(0)).toBe(100);   // 1^2 * 100
      expect(xpForNextLevel(1)).toBe(400);   // 2^2 * 100
      expect(xpForNextLevel(2)).toBe(900);   // 3^2 * 100
      expect(xpForNextLevel(5)).toBe(3600);  // 6^2 * 100
    });
  });

  describe('levelProgress', () => {
    it('should return 0% at level threshold', () => {
      expect(levelProgress(100)).toBe(0);  // Start of level 2
      expect(levelProgress(400)).toBe(0);  // Start of level 3
    });

    it('should return ~50% at middle of level', () => {
      // Level 1 (0-99): midpoint = 50
      const midLevel1 = levelProgress(50);
      expect(midLevel1).toBeGreaterThan(40);
      expect(midLevel1).toBeLessThan(60);
    });

    it('should return ~100% just before next level', () => {
      const almostLevel2 = levelProgress(99);
      expect(almostLevel2).toBeGreaterThan(90);
    });

    it('should never exceed 100%', () => {
      expect(levelProgress(1000000)).toBeLessThanOrEqual(100);
    });
  });

  describe('truncateAddress', () => {
    it('should truncate long addresses', () => {
      const address = 'AbCdEfGhIjKlMnOpQrStUvWxYz123456789';
      const result = truncateAddress(address);
      expect(result).toBe('AbCd...6789');
    });

    it('should respect custom char count', () => {
      const address = 'AbCdEfGhIjKlMnOpQrStUvWxYz123456789';
      const result = truncateAddress(address, 6);
      expect(result).toBe('AbCdEf...456789');
    });

    it('should not truncate short addresses', () => {
      const address = 'Short';
      const result = truncateAddress(address);
      expect(result).toBe('Short');
    });

    it('should handle empty string', () => {
      expect(truncateAddress('')).toBe('');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only for < 60', () => {
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(45)).toBe('45m');
      expect(formatDuration(59)).toBe('59m');
    });

    it('should format hours only for exact hours', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
      expect(formatDuration(180)).toBe('3h');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(150)).toBe('2h 30m');
      expect(formatDuration(75)).toBe('1h 15m');
    });
  });

  describe('isValidSolanaAddress', () => {
    it('should accept valid Solana addresses', () => {
      // Valid base58 format (32-44 chars)
      expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true);
      expect(isValidSolanaAddress('HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidSolanaAddress('')).toBe(false);
      expect(isValidSolanaAddress('short')).toBe(false);
      expect(isValidSolanaAddress('0' * 100)).toBe(false); // Too long
      expect(isValidSolanaAddress('invalid!chars@')).toBe(false);
    });

    it('should reject addresses with invalid base58 characters', () => {
      // Base58 doesn't include 0, O, I, l
      expect(isValidSolanaAddress('0OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO')).toBe(false);
      expect(isValidSolanaAddress('llllllllllllllllllllllllllllllll')).toBe(false);
    });
  });

  describe('getDifficultyColor', () => {
    it('should return correct colors for difficulties', () => {
      expect(getDifficultyColor('beginner')).toBe('text-green-500');
      expect(getDifficultyColor('intermediate')).toBe('text-yellow-500');
      expect(getDifficultyColor('advanced')).toBe('text-red-500');
    });

    it('should handle case insensitivity', () => {
      expect(getDifficultyColor('BEGINNER')).toBe('text-green-500');
      expect(getDifficultyColor('Intermediate')).toBe('text-yellow-500');
      expect(getDifficultyColor('AdVaNcEd')).toBe('text-red-500');
    });

    it('should return default for unknown difficulty', () => {
      expect(getDifficultyColor('unknown')).toBe('text-gray-500');
      expect(getDifficultyColor('')).toBe('text-gray-500');
    });
  });

  describe('getDifficultyVariant', () => {
    it('should return correct variants', () => {
      expect(getDifficultyVariant('beginner')).toBe('success');
      expect(getDifficultyVariant('intermediate')).toBe('warning');
      expect(getDifficultyVariant('advanced')).toBe('destructive');
    });

    it('should return default for unknown', () => {
      expect(getDifficultyVariant('unknown')).toBe('default');
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative numbers in calculateLevel', () => {
      expect(calculateLevel(-100)).toBe(0);
    });

    it('should handle very large XP values', () => {
      const level = calculateLevel(1000000);
      expect(level).toBeGreaterThan(0);
      expect(Number.isFinite(level)).toBe(true);
    });

    it('should handle decimal XP values', () => {
      expect(calculateLevel(250.5)).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should format XP quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        formatXP(i);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in <100ms
    });

    it('should calculate levels quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        calculateLevel(i);
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50); // Should complete in <50ms
    });
  });
});

describe('Type Safety', () => {
  it('should accept number types for XP functions', () => {
    const xp: number = 100;
    expect(() => formatXP(xp)).not.toThrow();
    expect(() => calculateLevel(xp)).not.toThrow();
  });

  it('should accept string types for address functions', () => {
    const address: string = '11111111111111111111111111111111';
    expect(() => truncateAddress(address)).not.toThrow();
    expect(() => isValidSolanaAddress(address)).not.toThrow();
  });
});
