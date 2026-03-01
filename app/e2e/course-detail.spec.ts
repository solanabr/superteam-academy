import { test, expect } from '@playwright/test';

const COURSES = [
  'solana-fundamentals',
  'anchor-basics',
  'token-2022',
  'defi-amm',
  'program-security',
];

test.describe('Course Detail', () => {
  for (const slug of COURSES) {
    test(`renders course: ${slug}`, async ({ page }) => {
      await page.goto(`/en/courses/${slug}`);
      await expect(page.locator('h1')).toBeVisible();
      // Module list should render
      await expect(page.locator('details').first()).toBeVisible();
    });
  }

  test('enroll button is visible', async ({ page }) => {
    await page.goto('/en/courses/solana-fundamentals');
    await expect(page.getByRole('button', { name: /enroll|connect/i })).toBeVisible();
  });

  test('first module is open by default', async ({ page }) => {
    await page.goto('/en/courses/solana-fundamentals');
    const firstDetails = page.locator('details').first();
    await expect(firstDetails).toHaveAttribute('open');
  });
});
