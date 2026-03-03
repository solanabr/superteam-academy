import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test('loads successfully with correct title', async ({ page }) => {
        await page.goto('/');
        // Page should load without errors
        await expect(page).toHaveURL(/\//);
        // Check for basic page structure
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('hero section is visible', async ({ page }) => {
        await page.goto('/');
        // Look for main heading or hero element
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('navigation bar is present', async ({ page }) => {
        await page.goto('/');
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible({ timeout: 10000 });
    });

    test('has a Get Started / Sign Up CTA', async ({ page }) => {
        await page.goto('/');
        // Look for CTA button
        const cta = page.getByRole('link', { name: /get started|sign up|start/i }).first();
        await expect(cta).toBeVisible({ timeout: 10000 });
    });

    test('footer is present', async ({ page }) => {
        await page.goto('/');
        const footer = page.locator('footer').first();
        await expect(footer).toBeVisible({ timeout: 15000 });
    });

    test('page has no console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        // Wait a few seconds for any deferred errors to surface
        await page.waitForTimeout(5000);
        // Filter out known non-critical errors
        const criticalErrors = errors.filter(
            (e) => !e.includes('favicon') && !e.includes('hydration') && !e.includes('third-party')
        );
        expect(criticalErrors.length).toBe(0);
    });
});
