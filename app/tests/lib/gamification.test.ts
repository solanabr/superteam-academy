import { describe, it, expect } from 'vitest';
import {
  calcLevel,
  xpToNextLevel,
  applyStreakMultiplier,
  checkAchievements,
  getLevelTitle,
  getStreakBonus,
  XP_CONFIG,
  ACHIEVEMENTS,
  ACHIEVEMENTS_I18N,
} from '@/lib/gamification';

describe('calcLevel', () => {
  it('returns 0 for 0 XP', () => {
    expect(calcLevel(0)).toBe(0);
  });

  it('returns 0 for 99 XP (not enough for level 1)', () => {
    expect(calcLevel(99)).toBe(0);
  });

  it('returns 1 for 100 XP', () => {
    expect(calcLevel(100)).toBe(1);
  });

  it('returns 2 for 400 XP', () => {
    expect(calcLevel(400)).toBe(2);
  });

  it('returns 3 for 900 XP', () => {
    expect(calcLevel(900)).toBe(3);
  });

  it('returns 10 for 10000 XP', () => {
    expect(calcLevel(10000)).toBe(10);
  });

  it('handles large XP values', () => {
    expect(calcLevel(250000)).toBe(50);
  });

  it('floors to nearest level', () => {
    expect(calcLevel(350)).toBe(1);
  });

  it('returns correct level for boundary -1', () => {
    expect(calcLevel(399)).toBe(1);
  });

  it('handles negative XP gracefully', () => {
    expect(calcLevel(-100)).toBeNaN();
  });
});

describe('xpToNextLevel', () => {
  it('returns correct values at level 0', () => {
    const result = xpToNextLevel(0);
    expect(result.level).toBe(0);
    expect(result.current).toBe(0);
    expect(result.required).toBe(100);
  });

  it('returns correct values at level 1', () => {
    const result = xpToNextLevel(100);
    expect(result.level).toBe(1);
    expect(result.current).toBe(0);
    expect(result.required).toBe(300);
  });

  it('returns progress within level', () => {
    const result = xpToNextLevel(250);
    expect(result.level).toBe(1);
    expect(result.current).toBe(150);
    expect(result.required).toBe(300);
  });

  it('returns correct values at level 10', () => {
    const result = xpToNextLevel(10000);
    expect(result.level).toBe(10);
    expect(result.current).toBe(0);
  });

  it('returns correct values at level 5', () => {
    const result = xpToNextLevel(2500);
    expect(result.level).toBe(5);
    expect(result.current).toBe(0);
  });
});

describe('applyStreakMultiplier', () => {
  it('returns base XP for 0 streak days', () => {
    expect(applyStreakMultiplier(100, 0)).toBe(100);
  });

  it('returns base XP for 6 streak days', () => {
    expect(applyStreakMultiplier(100, 6)).toBe(100);
  });

  it('applies 1.25x at 7 days', () => {
    expect(applyStreakMultiplier(100, 7)).toBe(125);
  });

  it('applies 1.25x at 29 days', () => {
    expect(applyStreakMultiplier(100, 29)).toBe(125);
  });

  it('applies 1.5x at 30 days', () => {
    expect(applyStreakMultiplier(100, 30)).toBe(150);
  });

  it('applies 1.5x at 99 days', () => {
    expect(applyStreakMultiplier(100, 99)).toBe(150);
  });

  it('applies 2x at 100 days', () => {
    expect(applyStreakMultiplier(100, 100)).toBe(200);
  });

  it('applies 2x at 365 days', () => {
    expect(applyStreakMultiplier(100, 365)).toBe(200);
  });

  it('floors result for non-round XP', () => {
    expect(applyStreakMultiplier(33, 7)).toBe(41);
  });

  it('returns 0 for 0 base XP regardless of streak', () => {
    expect(applyStreakMultiplier(0, 100)).toBe(0);
  });
});

describe('getStreakBonus', () => {
  it('returns 1x for no streak', () => {
    expect(getStreakBonus(0)).toBe('1x XP');
  });

  it('returns 1.25x for 7 days', () => {
    expect(getStreakBonus(7)).toBe('1.25x XP');
  });

  it('returns 1.5x for 30 days', () => {
    expect(getStreakBonus(30)).toBe('1.5x XP');
  });

  it('returns 2x for 100 days', () => {
    expect(getStreakBonus(100)).toBe('2x XP');
  });

  it('returns 1x for 6 days', () => {
    expect(getStreakBonus(6)).toBe('1x XP');
  });
});

describe('getLevelTitle', () => {
  it('returns Beginner for level 0 in en', () => {
    expect(getLevelTitle(0, 'en')).toBe('Beginner');
  });

  it('returns Iniciante for level 0 in pt-BR', () => {
    expect(getLevelTitle(0, 'pt-BR')).toBe('Iniciante');
  });

  it('returns Principiante for level 0 in es', () => {
    expect(getLevelTitle(0, 'es')).toBe('Principiante');
  });

  it('returns Learner for level 2 in en', () => {
    expect(getLevelTitle(2, 'en')).toBe('Learner');
  });

  it('returns Advanced Learner for level 5 in en', () => {
    expect(getLevelTitle(5, 'en')).toBe('Advanced Learner');
  });

  it('returns Developer for level 10 in en', () => {
    expect(getLevelTitle(10, 'en')).toBe('Developer');
  });

  it('returns Senior Developer for level 20 in en', () => {
    expect(getLevelTitle(20, 'en')).toBe('Senior Developer');
  });

  it('returns Blockchain Expert for level 30 in en', () => {
    expect(getLevelTitle(30, 'en')).toBe('Blockchain Expert');
  });

  it('returns Solana Master for level 50 in en', () => {
    expect(getLevelTitle(50, 'en')).toBe('Solana Master');
  });

  it('defaults to pt-BR when locale not found', () => {
    expect(getLevelTitle(0, 'fr')).toBe('Iniciante');
  });
});

describe('checkAchievements', () => {
  it('returns empty array for no progress', () => {
    expect(checkAchievements(0, 0, 0, 0, 0, 0, false)).toEqual([]);
  });

  it('unlocks first_lesson for 1 completed lesson', () => {
    const result = checkAchievements(1, 0, 0, 0, 0, 0, false);
    expect(result).toContain('first_lesson');
  });

  it('unlocks first_course for 1 completed course', () => {
    const result = checkAchievements(0, 1, 0, 0, 0, 0, false);
    expect(result).toContain('first_course');
  });

  it('unlocks streak_7 at 7 day streak', () => {
    const result = checkAchievements(0, 0, 7, 0, 0, 0, false);
    expect(result).toContain('streak_7');
  });

  it('unlocks streak_30 at 30 day streak', () => {
    const result = checkAchievements(0, 0, 30, 0, 0, 0, false);
    expect(result).toContain('streak_30');
  });

  it('unlocks streak_100 at 100 day streak', () => {
    const result = checkAchievements(0, 0, 100, 0, 0, 0, false);
    expect(result).toContain('streak_100');
  });

  it('unlocks all streak achievements at 100 days', () => {
    const result = checkAchievements(0, 0, 100, 0, 0, 0, false);
    expect(result).toContain('streak_7');
    expect(result).toContain('streak_30');
    expect(result).toContain('streak_100');
  });

  it('unlocks challenge_master at 50 challenges', () => {
    const result = checkAchievements(0, 0, 0, 50, 0, 0, false);
    expect(result).toContain('challenge_master');
  });

  it('unlocks top_10 at rank 1-10', () => {
    expect(checkAchievements(0, 0, 0, 0, 1, 0, false)).toContain('top_10');
    expect(checkAchievements(0, 0, 0, 0, 10, 0, false)).toContain('top_10');
  });

  it('does not unlock top_10 at rank 0 or 11+', () => {
    expect(checkAchievements(0, 0, 0, 0, 0, 0, false)).not.toContain('top_10');
    expect(checkAchievements(0, 0, 0, 0, 11, 0, false)).not.toContain('top_10');
  });

  it('unlocks credential_earner with 1+ credentials', () => {
    expect(checkAchievements(0, 0, 0, 0, 0, 1, false)).toContain('credential_earner');
  });

  it('unlocks early_adopter when flag is true', () => {
    expect(checkAchievements(0, 0, 0, 0, 0, 0, true)).toContain('early_adopter');
  });

  it('unlocks multiple achievements simultaneously', () => {
    const result = checkAchievements(5, 2, 30, 50, 3, 2, true);
    expect(result).toContain('first_lesson');
    expect(result).toContain('first_course');
    expect(result).toContain('streak_7');
    expect(result).toContain('streak_30');
    expect(result).toContain('challenge_master');
    expect(result).toContain('top_10');
    expect(result).toContain('credential_earner');
    expect(result).toContain('early_adopter');
  });
});

describe('XP_CONFIG', () => {
  it('has lesson config with min and max', () => {
    expect(XP_CONFIG.lesson.min).toBe(10);
    expect(XP_CONFIG.lesson.max).toBe(50);
  });

  it('has challenge config', () => {
    expect(XP_CONFIG.challenge.min).toBe(25);
    expect(XP_CONFIG.challenge.max).toBe(100);
  });

  it('has courseCompletion config', () => {
    expect(XP_CONFIG.courseCompletion.min).toBe(500);
    expect(XP_CONFIG.courseCompletion.max).toBe(2000);
  });

  it('has streak multipliers', () => {
    expect(XP_CONFIG.streak.multiplier7).toBe(1.25);
    expect(XP_CONFIG.streak.multiplier30).toBe(1.5);
    expect(XP_CONFIG.streak.multiplier100).toBe(2.0);
  });
});

describe('ACHIEVEMENTS', () => {
  it('has 10 achievements defined', () => {
    expect(ACHIEVEMENTS).toHaveLength(10);
  });

  it('all have required fields', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(a.xp).toBeGreaterThan(0);
      expect(a.icon).toBeTruthy();
    }
  });

  it('IDs are unique', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('ACHIEVEMENTS_I18N', () => {
  it('has all 3 locales for each achievement', () => {
    for (const a of ACHIEVEMENTS_I18N) {
      expect(a.name['pt-BR']).toBeTruthy();
      expect(a.name['en']).toBeTruthy();
      expect(a.name['es']).toBeTruthy();
      expect(a.description['pt-BR']).toBeTruthy();
      expect(a.description['en']).toBeTruthy();
      expect(a.description['es']).toBeTruthy();
    }
  });
});
