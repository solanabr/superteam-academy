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
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width < 768;

    await page.goto('/pt-BR');

    // On mobile, locale switcher is inside hamburger menu
    async function openMobileMenu() {
      if (isMobile) {
        await page.locator('button[aria-label="Toggle menu"]').click();
      }
    }

    await openMobileMenu();
    await page.locator('button', { hasText: 'EN' }).click();
    await expect(page).toHaveURL(/\/en/);

    await openMobileMenu();
    await page.locator('button', { hasText: 'ES' }).click();
    await expect(page).toHaveURL(/\/es/);

    await openMobileMenu();
    await page.locator('button', { hasText: 'PT' }).click();
    await expect(page).toHaveURL(/\/pt-BR/);
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
    // Mobile menu should contain nav links — check the last (mobile menu) occurrence
    await expect(page.locator('nav a[href="/en/courses"]').last()).toBeVisible();
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
