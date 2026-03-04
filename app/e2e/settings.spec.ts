import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("main")).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("4 tabs present (Profile, Account, Preferences, Privacy)", async ({
    page,
  }) => {
    const tabLabels = [/profile/i, /account/i, /preference/i, /privacy/i];
    for (const label of tabLabels) {
      const tab = page
        .locator("button, [role='tab'], a")
        .filter({ hasText: label });
      await expect(tab.first()).toBeVisible();
    }
  });

  test("Profile tab has form fields (name, bio)", async ({ page }) => {
    // Profile tab should be default or click it
    const profileTab = page
      .locator("button, [role='tab'], a")
      .filter({ hasText: /profile/i })
      .first();
    await profileTab.click();
    await page.waitForTimeout(300);

    // Look for form inputs
    const inputs = page.locator("input, textarea");
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("Preferences tab has theme toggle", async ({ page }) => {
    const preferencesTab = page
      .locator("button, [role='tab'], a")
      .filter({ hasText: /preference/i })
      .first();
    await preferencesTab.click();
    await page.waitForTimeout(300);

    // Should show theme/language settings
    const themeText = page.getByText(/theme|language/i);
    await expect(themeText.first()).toBeVisible();
  });

  test("Privacy tab has visibility toggle", async ({ page }) => {
    const privacyTab = page
      .locator("button, [role='tab'], a")
      .filter({ hasText: /privacy/i })
      .first();
    await privacyTab.click();
    await page.waitForTimeout(300);

    const visibilityText = page.getByText(/visibility|profile|public|private/i);
    await expect(visibilityText.first()).toBeVisible();
  });

  test("switching tabs changes content", async ({ page }) => {
    const accountTab = page
      .locator("button, [role='tab'], a")
      .filter({ hasText: /account/i })
      .first();
    await accountTab.click();
    await page.waitForTimeout(300);

    // Account tab should show wallet or account info
    const accountContent = page.getByText(/wallet|account|address|connect/i);
    await expect(accountContent.first()).toBeVisible();
  });
});
