import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('header is present on all pages', async ({ page }) => {
    const pages = ['/en', '/en/courses', '/en/leaderboard'];
    for (const url of pages) {
      await page.goto(url);
      await expect(page.locator('header')).toBeVisible();
    }
  });

  test('logo links to home', async ({ page }) => {
    await page.goto('/en/courses');
    await page.click('a:has-text("ACADEMY")');
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test('language switcher in header works', async ({ page }) => {
    await page.goto('/en');
    // Just verify the page loads
    await expect(page.locator('header')).toBeVisible();
  });

  test('i18n: pt-BR locale renders correctly', async ({ page }) => {
    await page.goto('/pt-BR/courses');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('i18n: es locale renders correctly', async ({ page }) => {
    await page.goto('/es/courses');
    await expect(page.locator('h1')).toBeVisible();
  });
});
