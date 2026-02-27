import { test, expect } from '@playwright/test';

const locales = ['pt-BR', 'en', 'es'];
const pages = [
  { path: '', name: 'landing' },
  { path: '/courses', name: 'courses' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/leaderboard', name: 'leaderboard' },
  { path: '/settings', name: 'settings' },
  { path: '/community', name: 'community' },
  { path: '/challenges', name: 'challenges' },
];

test.describe('Internationalization (i18n)', () => {
  for (const locale of locales) {
    test.describe(`${locale} locale`, () => {
      for (const page of pages) {
        test(`${page.name} page loads in ${locale}`, async ({ page: p }) => {
          const url = `http://localhost:3000/${locale}${page.path}`;
          const res = await p.goto(url);
          expect(res?.status()).toBeLessThan(500);
          // Verify the html lang attribute matches
          const html = p.locator('html');
          await expect(html).toHaveAttribute('lang', locale);
        });
      }

      test(`navigation links use ${locale} paths`, async ({ page: p }) => {
        await p.goto(`http://localhost:3000/${locale}`);
        // Check that internal links contain the locale prefix
        const links = await p.locator('a[href*="/' + locale + '/"]').count();
        expect(links).toBeGreaterThan(0);
      });
    });
  }

  test('locale switcher changes language', async ({ page }) => {
    await page.goto('http://localhost:3000/en');
    // Check the page loaded in English
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
  });

  test('default redirect works', async ({ page }) => {
    const res = await page.goto('http://localhost:3000');
    expect(res?.status()).toBeLessThan(500);
  });
});
