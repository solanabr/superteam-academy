import { test, expect } from '@playwright/test';

test.describe('Leaderboard', () => {
  test('renders leaderboard page', async ({ page }) => {
    await page.goto('/en/leaderboard');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('timeframe tabs are visible', async ({ page }) => {
    await page.goto('/en/leaderboard');
    await expect(page.getByRole('link', { name: /weekly/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /monthly/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /all time/i })).toBeVisible();
  });

  test('switching to weekly tab updates URL', async ({ page }) => {
    await page.goto('/en/leaderboard');
    await page.click('a:has-text("Weekly")');
    await expect(page).toHaveURL(/timeframe=weekly/);
  });
});
