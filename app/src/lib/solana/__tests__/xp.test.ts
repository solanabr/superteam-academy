import { describe, it, expect } from 'vitest';
import {
  calculateLevel,
  xpForLevel,
  xpToNextLevel,
  xpProgressPercent,
  getLevelTitle,
  LEVEL_TITLES,
} from '../xp';

describe('XP & Level helpers', () => {
  describe('calculateLevel', () => {
    it('returns 0 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(0);
    });

    it('returns 0 for XP below level 1 threshold', () => {
      expect(calculateLevel(99)).toBe(0);
    });

    it('returns 1 for exactly 100 XP', () => {
      expect(calculateLevel(100)).toBe(1);
    });

    it('returns 1 for XP between 100-399', () => {
      expect(calculateLevel(399)).toBe(1);
    });

    it('returns 2 for exactly 400 XP', () => {
      expect(calculateLevel(400)).toBe(2);
    });

    it('returns 3 for exactly 900 XP', () => {
      expect(calculateLevel(900)).toBe(3);
    });

    it('returns 10 for exactly 10000 XP', () => {
      expect(calculateLevel(10000)).toBe(10);
    });

    it('handles large XP values', () => {
      expect(calculateLevel(1000000)).toBe(100);
    });
  });

  describe('xpForLevel', () => {
    it('returns 0 for level 0', () => {
      expect(xpForLevel(0)).toBe(0);
    });

    it('returns 100 for level 1', () => {
      expect(xpForLevel(1)).toBe(100);
    });

    it('returns 400 for level 2', () => {
      expect(xpForLevel(2)).toBe(400);
    });

    it('returns 900 for level 3', () => {
      expect(xpForLevel(3)).toBe(900);
    });

    it('returns 10000 for level 10', () => {
      expect(xpForLevel(10)).toBe(10000);
    });
  });

  describe('xpForLevel / calculateLevel round-trip', () => {
    it('round-trips for levels 0-20', () => {
      for (let level = 0; level <= 20; level++) {
        const xp = xpForLevel(level);
        expect(calculateLevel(xp)).toBe(level);
      }
    });
  });

  describe('xpToNextLevel', () => {
    it('returns 100 for 0 XP (need 100 to reach level 1)', () => {
      expect(xpToNextLevel(0)).toBe(100);
    });

    it('returns 1 for 99 XP (1 away from level 1)', () => {
      expect(xpToNextLevel(99)).toBe(1);
    });

    it('returns 300 at exactly level 1 (100 XP, next at 400)', () => {
      expect(xpToNextLevel(100)).toBe(300);
    });

    it('returns 100 for 300 XP (300 away from level 2 at 400)', () => {
      expect(xpToNextLevel(300)).toBe(100);
    });

    it('returns correct value at level boundary', () => {
      // At 400 XP = level 2, next level at 900
      expect(xpToNextLevel(400)).toBe(500);
    });
  });

  describe('xpProgressPercent', () => {
    it('returns 0% at level boundary', () => {
      // At 100 XP = level 1 boundary
      expect(xpProgressPercent(100)).toBe(0);
    });

    it('returns 0% at 0 XP', () => {
      expect(xpProgressPercent(0)).toBe(0);
    });

    it('returns 50% at midpoint between levels', () => {
      // Level 1 at 100, level 2 at 400, midpoint at 250
      expect(xpProgressPercent(250)).toBe(50);
    });

    it('returns close to 100% just before next level', () => {
      // Level 1 at 100, level 2 at 400
      // At 399 XP: (399-100)/(400-100) = 299/300 = 99.67%
      const pct = xpProgressPercent(399);
      expect(pct).toBeGreaterThan(99);
      expect(pct).toBeLessThan(100);
    });

    it('handles level 0 range correctly', () => {
      // Level 0 at 0, level 1 at 100
      // At 50 XP: (50-0)/(100-0) = 50%
      expect(xpProgressPercent(50)).toBe(50);
    });

    it('returns correct percentage for higher levels', () => {
      // Level 2 at 400, level 3 at 900
      // At 650 XP: (650-400)/(900-400) = 250/500 = 50%
      expect(xpProgressPercent(650)).toBe(50);
    });
  });

  describe('LEVEL_TITLES', () => {
    it('has 11 entries', () => {
      expect(LEVEL_TITLES).toHaveLength(11);
    });

    it('starts with Newcomer and ends with Legend', () => {
      expect(LEVEL_TITLES[0]).toBe('Newcomer');
      expect(LEVEL_TITLES[10]).toBe('Legend');
    });
  });

  describe('getLevelTitle', () => {
    it('returns Newcomer for level 0', () => {
      expect(getLevelTitle(0)).toBe('Newcomer');
    });

    it('returns Explorer for level 1', () => {
      expect(getLevelTitle(1)).toBe('Explorer');
    });

    it('returns correct title for each defined level', () => {
      const expected = [
        'Newcomer', 'Explorer', 'Builder', 'Developer', 'Engineer',
        'Architect', 'Specialist', 'Expert', 'Master', 'Grandmaster', 'Legend',
      ];
      expected.forEach((title, level) => {
        expect(getLevelTitle(level)).toBe(title);
      });
    });

    it('returns Legend for levels beyond the array', () => {
      expect(getLevelTitle(11)).toBe('Legend');
      expect(getLevelTitle(50)).toBe('Legend');
      expect(getLevelTitle(100)).toBe('Legend');
    });
  });
});
