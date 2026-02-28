import { test, expect } from '@playwright/test';
import { SettingsPage } from '../pages/settings.page';
import { I18N } from '../fixtures/test-data';

test.describe('Settings', () => {
  let settings: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settings = new SettingsPage(page);
    await settings.navigate();
  });

  test('settings page loads with all sections', async ({ page }) => {
    await expect(settings.pageTitle).toBeVisible();
    await expect(settings.pageTitle).toContainText(I18N.en.settingsTitle);

    // The page should contain the key sections
    await expect(page.getByText(/profile/i).first()).toBeVisible();
    await expect(page.getByText(/appearance/i).first()).toBeVisible();
  });

  test('theme toggle buttons change the active theme', async ({ page }) => {
    // Switch to dark
    await settings.switchTheme('Dark');
    const darkButton = page.getByRole('button', { name: /dark/i });
    await expect(darkButton).toHaveAttribute('aria-pressed', 'true');

    // Switch to light
    await settings.switchTheme('Light');
    const lightButton = page.getByRole('button', { name: /light/i });
    await expect(lightButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('display name input is editable', async () => {
    await expect(settings.displayNameInput).toBeVisible();

    await settings.displayNameInput.fill('Test User');
    await expect(settings.displayNameInput).toHaveValue('Test User');
  });
});
