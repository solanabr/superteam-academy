import { describe, it, expect } from 'vitest';
import { BANNER } from '@/lib/banner-constants';

describe('Banner constants', () => {
    it('BANNER is exported', () => {
        expect(BANNER).toBeDefined();
    });

    it('is an object', () => {
        expect(typeof BANNER).toBe('object');
    });

    it('has challenges section with light and dark themes', () => {
        expect(BANNER.challenges).toBeDefined();
        expect(BANNER.challenges.light).toHaveProperty('src');
        expect(BANNER.challenges.light).toHaveProperty('blur');
        expect(BANNER.challenges.dark).toHaveProperty('src');
        expect(BANNER.challenges.dark).toHaveProperty('blur');
    });

    it('has community section', () => {
        expect(BANNER.community).toBeDefined();
        expect(BANNER.community).toHaveProperty('src');
        expect(BANNER.community).toHaveProperty('blur');
    });

    it('has achievements section', () => {
        expect(BANNER.achievements).toBeDefined();
        expect(BANNER.achievements).toHaveProperty('src');
        expect(BANNER.achievements).toHaveProperty('blur');
    });

    it('all src paths are WebP images', () => {
        expect(BANNER.challenges.light.src).toMatch(/\.webp$/);
        expect(BANNER.challenges.dark.src).toMatch(/\.webp$/);
        expect(BANNER.community.src).toMatch(/\.webp$/);
        expect(BANNER.achievements.src).toMatch(/\.webp$/);
    });

    it('all blur values are base64 data URIs', () => {
        expect(BANNER.challenges.light.blur).toMatch(/^data:image\/webp;base64,/);
        expect(BANNER.challenges.dark.blur).toMatch(/^data:image\/webp;base64,/);
        expect(BANNER.community.blur).toMatch(/^data:image\/webp;base64,/);
        expect(BANNER.achievements.blur).toMatch(/^data:image\/webp;base64,/);
    });
});
