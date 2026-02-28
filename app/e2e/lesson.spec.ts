import { test, expect } from '@playwright/test';

test.describe('Lesson View', () => {
  test('renders lesson split layout', async ({ page }) => {
    await page.goto('/en/courses/solana-fundamentals/lessons/l1');
    // Top bar should be visible
    await expect(page.getByRole('link', { name: /back/i })).toBeVisible();
  });

  test('shows lesson content', async ({ page }) => {
    await page.goto('/en/courses/solana-fundamentals/lessons/l1');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('hints panel can be toggled', async ({ page }) => {
    await page.goto('/en/courses/solana-fundamentals/lessons/l1');
    const hintsBtn = page.locator('button:has-text("Hints")');
    if (await hintsBtn.isVisible()) {
      await hintsBtn.click();
      await expect(page.locator('button:has-text("Show Hint")')).toBeVisible();
    }
  });
});
