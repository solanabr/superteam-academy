import { test, expect } from '@playwright/test';

test.describe('Superteam Academy — Smoke Tests', () => {

    test('Homepage renders and has key elements', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Superteam Academy/);
        // Main heading is present
        await expect(page.locator('h1').first()).toBeVisible();
    });

    test('Courses page loads', async ({ page }) => {
        await page.goto('/courses');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
    });

    test('Dashboard page loads', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
    });

    test('Leaderboard page loads', async ({ page }) => {
        await page.goto('/leaderboard');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
    });

    test('Community Forum page loads', async ({ page }) => {
        await page.goto('/community');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('text=Community').first()).toBeVisible();
    });

    test('Challenges page loads', async ({ page }) => {
        await page.goto('/challenges');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('text=Challenges').first()).toBeVisible();
    });

    test('Admin Dashboard page loads', async ({ page }) => {
        await page.goto('/admin');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('text=Admin').first()).toBeVisible();
    });

    test('Onboarding Quiz page loads', async ({ page }) => {
        await page.goto('/welcome');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
    });

    test('Settings page loads', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
    });

    test('Profile page loads', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
    });
});
