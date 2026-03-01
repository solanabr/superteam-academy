import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('displays hero section with CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Solana');
    await expect(page.locator('a[href*="courses"]').first()).toBeVisible();
  });

  test('shows learning tracks section', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('#tracks')).toBeVisible();
  });

  test('shows stats', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByText('500+')).toBeVisible();
  });

  test('footer has newsletter signup', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
