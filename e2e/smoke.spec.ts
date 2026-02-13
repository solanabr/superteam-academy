import { expect, test } from '@playwright/test';

test.describe('Public Smoke', () => {
  test('core public navigation renders expected shells', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    await page.getByTestId('nav-courses').click();
    await expect(page).toHaveURL(/\/courses$/);
    await expect(page.getByTestId('courses-page')).toBeVisible();

    await page.getByTestId('nav-leaderboard').click();
    await expect(page).toHaveURL(/\/leaderboard$/);
    await expect(page.getByTestId('leaderboard-page')).toBeVisible();

    await page.getByTestId('nav-register').click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByTestId('register-page')).toBeVisible();
  });

  test('language switcher persists locale in localStorage', async ({ page }) => {
    await page.goto('/');

    await page.getByTitle('English').click();

    const locale = await page.evaluate(() => window.localStorage.getItem('superteam.locale'));
    expect(locale).toBe('en');
  });

  test('certificate route resolves without server error', async ({ page }) => {
    const response = await page.goto('/certificates/e2e-check');
    expect(response).not.toBeNull();
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByTestId('site-header')).toBeVisible();
  });
});
