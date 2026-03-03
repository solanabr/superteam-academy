import { test, expect } from '@playwright/test';

test.describe('Navigation & Responsiveness', () => {
    test('landing page nav links are clickable', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Check that nav links exist
        const navLinks = page.locator('nav a');
        const count = await navLinks.count();
        expect(count).toBeGreaterThan(0);
    });

    test('courses page loads', async ({ page }) => {
        await page.goto('/courses');
        // Courses is a protected route — either loads courses page or redirects to login
        const url = page.url();
        const isCoursesOrLoginRedirect = /courses/.test(url) || /login/.test(url);
        expect(isCoursesOrLoginRedirect).toBe(true);
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('leaderboard page loads', async ({ page }) => {
        await page.goto('/leaderboard');
        await expect(page).toHaveURL(/leaderboard/);
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('community page loads', async ({ page }) => {
        await page.goto('/community');
        await expect(page).toHaveURL(/community/);
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('responsive: mobile viewport renders correctly', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        const body = page.locator('body');
        await expect(body).toBeVisible();
        // No horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // small tolerance
    });

    test('responsive: tablet viewport renders correctly', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/');
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });
});
