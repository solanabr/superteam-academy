import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  test("mobile viewport has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);
  });

  test("mobile viewport shows page content", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toContainText("Settings", { timeout: 15000 });
    await expect(page.locator("button").filter({ hasText: "Dark" }).first()).toBeVisible();
  });

  test("desktop viewport shows full layout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("nav, header").first()).toBeVisible();
    await expect(page.locator("footer").first()).toBeVisible();
  });

  test("leaderboard table scrolls on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/leaderboard");
    await expect(page.locator("h1")).toContainText("Leaderboard", { timeout: 15000 });
    // Table or empty state should render without breaking layout
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);
  });

  test("settings renders all sections on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toContainText("Settings", { timeout: 15000 });
    await expect(page.locator("text=Privacy").first()).toBeVisible();
    await expect(page.locator("text=Connected Accounts").first()).toBeVisible();
  });
});
