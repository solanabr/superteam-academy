import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS } from '@/backend/achievements';

describe('ACHIEVEMENTS', () => {
    it('is a non-empty array', () => {
        expect(Array.isArray(ACHIEVEMENTS)).toBe(true);
        expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
    });

    it('each achievement has required fields', () => {
        for (const a of ACHIEVEMENTS) {
            expect(a).toHaveProperty('id');
            expect(a).toHaveProperty('name');
            expect(a).toHaveProperty('description');
            expect(a).toHaveProperty('category');
            expect(a).toHaveProperty('icon');
            expect(a).toHaveProperty('xpReward');
            expect(a).toHaveProperty('badge');
            expect(typeof a.id).toBe('string');
            expect(typeof a.name).toBe('string');
            expect(typeof a.xpReward).toBe('number');
            expect(a.xpReward).toBeGreaterThan(0);
        }
    });

    it('all IDs are unique', () => {
        const ids = ACHIEVEMENTS.map(a => a.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    it('categories are valid', () => {
        const validCategories = ['progress', 'streak', 'skill', 'special'];
        for (const a of ACHIEVEMENTS) {
            expect(validCategories).toContain(a.category);
        }
    });

    it('badge paths are SVG files', () => {
        for (const a of ACHIEVEMENTS) {
            expect(a.badge).toMatch(/\.svg$/);
            expect(a.badge).toMatch(/^\/badges\//);
        }
    });

    it('has the expected total number of achievements', () => {
        // 4 progress + 3 streak + 4 skill + 2 special = 13
        expect(ACHIEVEMENTS.length).toBe(13);
    });
});
