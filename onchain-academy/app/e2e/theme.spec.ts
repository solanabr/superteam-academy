import { test, expect } from "@playwright/test";

test.describe("Theme switching", () => {
  test("settings page has theme toggle buttons", async ({ page }) => {
    await page.goto("/en/settings");
    // Both theme options should be present
    await expect(page.getByRole("button", { name: /dark/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /light/i })).toBeVisible();
  });

  test("switching to light theme updates the html class", async ({ page }) => {
    await page.goto("/en/settings");
    // Click the light theme button
    await page.getByRole("button", { name: /light/i }).click();
    // next-themes sets the class on <html>
    await expect(page.locator("html")).toHaveClass(/light/, {
      timeout: 5_000,
    });
  });

  test("switching to dark theme updates the html class", async ({ page }) => {
    await page.goto("/en/settings");
    // First switch to light, then back to dark
    await page.getByRole("button", { name: /light/i }).click();
    await expect(page.locator("html")).toHaveClass(/light/, {
      timeout: 5_000,
    });

    await page.getByRole("button", { name: /dark/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5_000 });
  });

  test("theme preference persists across navigation", async ({ page }) => {
    await page.goto("/en/settings");
    await page.getByRole("button", { name: /light/i }).click();
    await expect(page.locator("html")).toHaveClass(/light/, {
      timeout: 5_000,
    });

    // Navigate to another page
    await page.goto("/en/courses");
    // Theme should persist
    await expect(page.locator("html")).toHaveClass(/light/, {
      timeout: 5_000,
    });
  });
});
