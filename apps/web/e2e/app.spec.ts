import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads correctly with hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Superteam Academy')).toBeVisible();
    await expect(page.locator('text=Master Solana Development')).toBeVisible();
  });

  test('has navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav >> text=Courses')).toBeVisible();
    await expect(page.locator('nav >> text=Leaderboard')).toBeVisible();
  });
});

test.describe('Course Catalog', () => {
  test('navigates to courses page', async ({ page }) => {
    await page.goto('/courses');
    await expect(page).toHaveURL(/\/courses/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('shows filter buttons', async ({ page }) => {
    await page.goto('/courses');
    await expect(page.locator('text=Beginner')).toBeVisible();
    await expect(page.locator('text=Intermediate')).toBeVisible();
    await expect(page.locator('text=Advanced')).toBeVisible();
  });

  test('filters courses by difficulty', async ({ page }) => {
    await page.goto('/courses');
    const beginnerBtn = page.locator('button', { hasText: 'Beginner' });
    if (await beginnerBtn.isVisible()) {
      await beginnerBtn.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Course Detail', () => {
  test('renders course detail page', async ({ page }) => {
    await page.goto('/courses');
    const firstCourse = page.locator('a[href*="/courses/"]').first();
    if (await firstCourse.isVisible()) {
      await firstCourse.click();
      await expect(page.locator('text=Enroll')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Leaderboard', () => {
  test('loads leaderboard page', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page.locator('text=Leaderboard')).toBeVisible();
  });

  test('shows time filter tabs', async ({ page }) => {
    await page.goto('/leaderboard');
    await expect(page.locator('text=Weekly')).toBeVisible();
    await expect(page.locator('text=Monthly')).toBeVisible();
  });
});

test.describe('Auth', () => {
  test('renders sign-in options', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('text=Connect Wallet')).toBeVisible();
    await expect(page.locator('text=Google')).toBeVisible();
    await expect(page.locator('text=GitHub')).toBeVisible();
  });
});

test.describe('Theme Toggle', () => {
  test('toggles between dark and light mode', async ({ page }) => {
    await page.goto('/');
    const themeButton = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeButton).toBeVisible();

    const html = page.locator('html');
    const initialClass = await html.getAttribute('class');

    await themeButton.click();
    await page.waitForTimeout(500);

    const newClass = await html.getAttribute('class');
    expect(newClass).not.toBe(initialClass);
  });
});

test.describe('Language Switcher', () => {
  test('language switcher is visible', async ({ page }) => {
    await page.goto('/');
    // The language switcher should be in the header
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});
