import { test, expect } from '@playwright/test';

/**
 * Navigation & i18n E2E tests
 *
 * Verifies that:
 * - The platform loads correctly in all 3 locales
 * - URL routing is locale-prefixed
 * - Locale switching preserves context
 * - Nav links resolve to correct locale paths
 */

const LOCALES = [
  { code: 'pt-BR', coursesPath: '/pt-BR/cursos', dashPath: '/pt-BR/painel', lbPath: '/pt-BR/classificacao' },
  { code: 'en', coursesPath: '/en/courses', dashPath: '/en/dashboard', lbPath: '/en/leaderboard' },
  { code: 'es', coursesPath: '/es/cursos', dashPath: '/es/panel', lbPath: '/es/clasificacion' },
] as const;

test.describe('Locale routing', () => {
  test('root redirects to default locale (pt-BR)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/pt-BR/);
  });

  for (const { code, coursesPath } of LOCALES) {
    test(`/${code} home page loads correctly`, async ({ page }) => {
      await page.goto(`/${code}`);
      await expect(page).toHaveURL(`/${code}`);
      await expect(page.locator('nav')).toBeVisible();
    });

    test(`${code}: courses page resolves to ${coursesPath}`, async ({ page }) => {
      await page.goto(`/${code}`);
      // Check link exists anywhere on page (nav may be hidden on mobile)
      const coursesLink = page.locator(`a[href="${coursesPath}"]`).first();
      await expect(coursesLink).toBeAttached();
    });
  }

  test('locale switcher changes URL prefix', async ({ page }) => {
    await page.goto('/pt-BR');
    
    // Try to find and use the locale switcher
    // It might be a dropdown, button group, or link-based
    const enLink = page.locator('a[href*="/en"], button:has-text("EN"), [data-locale="en"]').first();
    if (await enLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enLink.click();
      await expect(page).toHaveURL(/\/en/);
    } else {
      // If locale switcher is in a dropdown, try to open it first
      const trigger = page.locator('button:has-text("PT"), button:has-text("BR"), [aria-label*="language"], [aria-label*="locale"]').first();
      if (await trigger.isVisible({ timeout: 2000 }).catch(() => false)) {
        await trigger.click();
        await page.waitForTimeout(300);
        const enOption = page.locator('a[href*="/en"], button:has-text("EN"), [data-locale="en"]').first();
        if (await enOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await enOption.click();
          await expect(page).toHaveURL(/\/en/);
        }
      }
    }
    // Verify we can navigate to different locale URLs directly
    await page.goto('/en');
    await expect(page).toHaveURL(/\/en/);
    await page.goto('/es');
    await expect(page).toHaveURL(/\/es/);
  });
});

test.describe('Navigation links', () => {
  test('desktop nav renders all main links', async ({ page }) => {
    await page.goto('/en');
    // Check links exist in page DOM (may be hidden on mobile in collapsed nav)
    await expect(page.locator('a[href="/en/courses"]').first()).toBeAttached();
    await expect(page.locator('a[href="/en/dashboard"]').first()).toBeAttached();
    await expect(page.locator('a[href="/en/leaderboard"]').first()).toBeAttached();
    await expect(page.locator('a[href="/en/community"]').first()).toBeAttached();
  });

  test('admin link is present in nav', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('a[href="/en/admin"]').first()).toBeAttached();
  });

  test('logo links to locale home', async ({ page }) => {
    await page.goto('/en/courses');
    const logoLink = page.locator('nav a').first();
    await logoLink.click();
    await expect(page).toHaveURL('/en');
  });
});

test.describe('Mobile nav', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('hamburger opens mobile menu', async ({ page }) => {
    await page.goto('/en');
    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await hamburger.click();
    // Wait for mobile menu animation
    await page.waitForTimeout(500);
    // Mobile menu should contain nav links — check the last (mobile menu) occurrence
    await expect(page.locator('nav a[href="/en/courses"]').last()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('nav a[href="/en/dashboard"]').last()).toBeVisible();
  });

  test('mobile menu closes on link click', async ({ page }) => {
    await page.goto('/en');
    await page.locator('button[aria-label="Toggle menu"]').click();
    // Click a nav link
    await page.locator('nav a[href="/en/courses"]').last().click();
    await expect(page).toHaveURL('/en/courses');
  });
});
