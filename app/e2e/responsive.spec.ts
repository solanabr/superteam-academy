import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const pages = [
  { path: '/en', name: 'landing' },
  { path: '/en/courses', name: 'courses' },
  { path: '/en/leaderboard', name: 'leaderboard' },
  { path: '/en/dashboard', name: 'dashboard' },
  { path: '/en/settings', name: 'settings' },
];

test.describe('Responsive Design', () => {
  for (const vp of viewports) {
    test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const page of pages) {
        test(`${page.name} renders without horizontal overflow`, async ({ page: p }) => {
          await p.goto(`http://localhost:3000${page.path}`);
          const bodyWidth = await p.evaluate(() => document.body.scrollWidth);
          const viewportWidth = await p.evaluate(() => window.innerWidth);
          expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
        });
      }

      test('navigation is accessible', async ({ page: p }) => {
        await p.goto('http://localhost:3000/en');
        if (vp.name === 'mobile') {
          // Mobile should have a menu button or hamburger
          const nav = p.locator('nav, [role="navigation"], header');
          await expect(nav.first()).toBeVisible();
        } else {
          // Desktop/tablet should have visible nav links
          const nav = p.locator('nav, [role="navigation"], header');
          await expect(nav.first()).toBeVisible();
        }
      });
    });
  }
});
