import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
    test('renders login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveURL(/login/);
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('shows Google sign-in option', async ({ page }) => {
        await page.goto('/login');
        const googleBtn = page.getByRole('button', { name: /google/i }).or(
            page.locator('[data-provider="google"]')
        ).or(page.locator('text=Google')).first();
        await expect(googleBtn).toBeVisible({ timeout: 10000 });
    });

    test('shows GitHub sign-in option', async ({ page }) => {
        await page.goto('/login');
        const githubBtn = page.getByRole('button', { name: /github/i }).or(
            page.locator('[data-provider="github"]')
        ).or(page.locator('text=GitHub')).first();
        await expect(githubBtn).toBeVisible({ timeout: 10000 });
    });

    test('shows wallet connect option', async ({ page }) => {
        await page.goto('/login');
        const walletBtn = page.getByRole('button', { name: /wallet|connect/i }).or(
            page.locator('text=Wallet')
        ).first();
        await expect(walletBtn).toBeVisible({ timeout: 10000 });
    });
});
