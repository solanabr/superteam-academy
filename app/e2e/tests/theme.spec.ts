import { test, expect } from '@playwright/test';
import { SettingsPage } from '../pages/settings.page';

test.describe('Theme Switching', () => {
  let settings: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settings = new SettingsPage(page);
    await settings.navigate();
  });

  test('page loads with a default theme', async ({ page }) => {
    // next-themes with attribute="class" sets "light" or "dark" on <html>.
    // Default is "light" per the ThemeProvider config.
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toBeTruthy();
    // On first load, the class should contain "light" (default) or "dark" (system preference)
    expect(htmlClass!.includes('light') || htmlClass!.includes('dark')).toBeTruthy();
  });

  test('switch to dark mode applies dark class to html', async ({ page }) => {
    await settings.switchTheme('Dark');

    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('switch to light mode applies light class to html', async ({ page }) => {
    // First set to dark to ensure toggling works
    await settings.switchTheme('Dark');
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Then switch to light
    await settings.switchTheme('Light');
    await expect(page.locator('html')).toHaveClass(/light/);
  });
});
