import { expect, test } from '@playwright/test';

const seededRegistration = {
  id: 'e2e-user-1',
  name: 'E2E User',
  email: 'e2e@example.com',
  username: 'e2e_user',
  providers: ['github'],
  walletAddress: '',
  createdAt: new Date().toISOString()
};

test.describe('Account Gating', () => {
  test('dashboard and settings prompt register when account is missing', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-no-account')).toBeVisible();
    await expect(page.getByTestId('dashboard-register-link')).toHaveAttribute('href', '/register');

    await page.goto('/settings');
    await expect(page.getByTestId('settings-no-account')).toBeVisible();
    await expect(page.getByTestId('settings-register-link')).toHaveAttribute('href', '/register');
  });

  test('register validates required wallet flow and shows status feedback', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByTestId('register-page')).toBeVisible();

    await page.getByTestId('register-name-input').fill('E2E User');
    await page.getByTestId('register-username-input').fill('e2euser');
    await page.getByTestId('register-email-input').fill('e2e@example.com');
    await page.getByTestId('register-submit-button').click();

    await expect(page.getByTestId('register-status')).toBeVisible();
  });

  test('seeded local registration unlocks dashboard and settings account views', async ({ page }) => {
    await page.addInitScript((record) => {
      window.localStorage.setItem('superteam.registration.v1', JSON.stringify(record));
    }, seededRegistration);

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await expect(page.getByTestId('dashboard-metrics')).toBeVisible();

    await page.goto('/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();
    await expect(page.getByTestId('settings-header')).toBeVisible();
  });
});
