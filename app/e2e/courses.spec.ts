import { test, expect } from '@playwright/test';

test.describe('Courses Catalog', () => {
  test('displays course grid', async ({ page }) => {
    await page.goto('/en/courses');
    await expect(page.locator('h1')).toBeVisible();
    // At least one course card
    await expect(page.locator('article, [data-testid="course-card"]').first()).toBeVisible();
  });

  test('difficulty filters work', async ({ page }) => {
    await page.goto('/en/courses');
    await page.click('a:has-text("Beginner")');
    await expect(page).toHaveURL(/difficulty=beginner/);
  });

  test('search filters courses', async ({ page }) => {
    await page.goto('/en/courses');
    await page.fill('input[name="q"]', 'anchor');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/q=anchor/);
  });

  test('navigates to course detail', async ({ page }) => {
    await page.goto('/en/courses/solana-fundamentals');
    await expect(page.locator('h1')).toContainText('Solana');
    await expect(page.locator('details').first()).toBeVisible();
  });
});
