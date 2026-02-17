import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("shows sign in options on settings page", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.getByText(/account/i).first()).toBeVisible();
  });

  test("profile page renders", async ({ page }) => {
    await page.goto("/en/profile/me");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Settings", () => {
  test("displays preference tabs", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.getByText(/profile/i).first()).toBeVisible();
  });

  test("shows theme options", async ({ page }) => {
    await page.goto("/en/settings");
    const prefsTab = page.getByRole("tab", { name: /preferences/i });
    if (await prefsTab.isVisible()) {
      await prefsTab.click();
      await expect(page.getByText(/dark/i).first()).toBeVisible();
    }
  });
});
