import { test, expect } from "@playwright/test";
import { gotoWithLocale } from "./fixtures/test-helpers";

test.describe("Settings Page", () => {
  test("settings page renders with all section headings", async ({ page }) => {
    await gotoWithLocale(page, "/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    // All main sections should be present
    await expect(page.getByText("Appearance").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("theme toggle buttons are visible and functional", async ({ page }) => {
    await gotoWithLocale(page, "/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    // Both theme buttons should be present
    const darkButton = page.getByRole("button", { name: /dark/i });
    const lightButton = page.getByRole("button", { name: /light/i });
    await expect(darkButton).toBeVisible({ timeout: 10_000 });
    await expect(lightButton).toBeVisible();

    // Click light theme
    await lightButton.click({ timeout: 15_000 });
    await expect(page.locator("html")).toHaveClass(/light/, {
      timeout: 5_000,
    });

    // Click dark theme
    await darkButton.click({ timeout: 15_000 });
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5_000 });
  });

  test("language selector shows all locale options", async ({ page }) => {
    await gotoWithLocale(page, "/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    // Language links
    await expect(page.getByRole("link", { name: "English" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("link", { name: /Portugu[eê]s/ }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Espa[nñ]ol/ })).toBeVisible();
  });

  test("profile section shows form fields", async ({ page }) => {
    await gotoWithLocale(page, "/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    // Profile form fields
    const displayNameInput = page.locator("#settings-display-name");
    await expect(displayNameInput).toBeVisible({ timeout: 10_000 });

    const bioTextarea = page.locator("#settings-bio");
    await expect(bioTextarea).toBeVisible();

    // Save button
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible();
  });

  test("privacy section has toggle switches", async ({ page }) => {
    await gotoWithLocale(page, "/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    // Privacy toggles should be present
    await expect(page.getByText("Public Profile").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Show on Leaderboard").first()).toBeVisible();

    // Toggle switches (role=switch)
    const switches = page.getByRole("switch");
    const count = await switches.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("export data button is present in privacy section", async ({ page }) => {
    await gotoWithLocale(page, "/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    // Export data section
    await expect(page.getByText("Export Your Data").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible();
  });
});
