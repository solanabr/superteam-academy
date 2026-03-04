import { describe, it, expect } from 'vitest';
import {
    calculateLevel,
    getXpForLevel,
    getNextLevelXp,
    getLevelProgress,
    calculateCompletionBonus,
    calculateCourseTotalXp,
    calculateCreatorReward,
    MAX_LEVEL,
} from '@/context/xp-calculations';

describe('calculateLevel', () => {
    it('returns 1 for 0 XP', () => {
        expect(calculateLevel(0)).toBe(1);
    });

    it('returns 1 for negative XP', () => {
        expect(calculateLevel(-100)).toBe(1);
    });

    it('returns 2 at exactly 1000 XP', () => {
        expect(calculateLevel(1000)).toBe(2);
    });

    it('returns 2 for 999 XP (below threshold)', () => {
        expect(calculateLevel(999)).toBe(1);
    });

    it('returns MAX_LEVEL for very high XP', () => {
        expect(calculateLevel(1_000_000)).toBe(MAX_LEVEL);
    });

    it('returns 10 at exactly 120,000 XP', () => {
        expect(calculateLevel(120_000)).toBe(10);
    });

    it('handles all level boundaries', () => {
        const thresholds = [0, 1000, 2500, 5000, 10000, 20000, 35000, 55000, 80000, 120000];
        thresholds.forEach((xp, i) => {
            expect(calculateLevel(xp)).toBe(i + 1);
        });
    });
});

describe('getXpForLevel', () => {
    it('returns 0 for level 1', () => {
        expect(getXpForLevel(1)).toBe(0);
    });

    it('returns 1000 for level 2', () => {
        expect(getXpForLevel(2)).toBe(1000);
    });

    it('clamps to level 1 for level 0', () => {
        expect(getXpForLevel(0)).toBe(0);
    });

    it('clamps to MAX_LEVEL for level > MAX_LEVEL', () => {
        expect(getXpForLevel(999)).toBe(120_000);
    });
});

describe('getNextLevelXp', () => {
    it('returns 1000 for 0 XP (level 1 -> level 2)', () => {
        expect(getNextLevelXp(0)).toBe(1000);
    });

    it('returns Infinity at max level', () => {
        expect(getNextLevelXp(120_000)).toBe(Infinity);
    });

    it('returns Infinity for XP beyond max level', () => {
        expect(getNextLevelXp(999_999)).toBe(Infinity);
    });
});

describe('getLevelProgress', () => {
    it('returns 0 at start of level 1', () => {
        expect(getLevelProgress(0)).toBe(0);
    });

    it('returns 50 at halfway between level 1 and 2', () => {
        expect(getLevelProgress(500)).toBe(50);
    });

    it('returns 100 at max level', () => {
        expect(getLevelProgress(120_000)).toBe(100);
    });

    it('returns value between 0 and 100', () => {
        const progress = getLevelProgress(1500);
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
    });
});

describe('calculateCompletionBonus', () => {
    it('returns floor((xpPerLesson * lessonCount) / 2)', () => {
        expect(calculateCompletionBonus(100, 10)).toBe(500);
    });

    it('returns 0 for 0 lessons', () => {
        expect(calculateCompletionBonus(100, 0)).toBe(0);
    });

    it('returns 0 for 0 XP per lesson', () => {
        expect(calculateCompletionBonus(0, 10)).toBe(0);
    });

    it('handles negative inputs by clamping to 0', () => {
        expect(calculateCompletionBonus(-100, 10)).toBe(0);
        expect(calculateCompletionBonus(100, -10)).toBe(0);
    });

    it('floors fractional results', () => {
        expect(calculateCompletionBonus(7, 3)).toBe(10); // floor(21/2) = 10
    });
});

describe('calculateCourseTotalXp', () => {
    it('returns lessons XP + completion bonus', () => {
        // 100 * 10 = 1000 lessons + 500 bonus = 1500
        expect(calculateCourseTotalXp(100, 10)).toBe(1500);
    });

    it('returns 0 for 0 lessons', () => {
        expect(calculateCourseTotalXp(100, 0)).toBe(0);
    });
});

describe('calculateCreatorReward', () => {
    it('returns reward when threshold is met', () => {
        expect(calculateCreatorReward(500, 10, 10)).toBe(500);
    });

    it('returns reward when threshold is exceeded', () => {
        expect(calculateCreatorReward(500, 10, 20)).toBe(500);
    });

    it('returns 0 when below threshold', () => {
        expect(calculateCreatorReward(500, 10, 5)).toBe(0);
    });

    it('handles negative inputs by clamping to 0', () => {
        expect(calculateCreatorReward(-500, 10, 20)).toBe(0);
    });
});
