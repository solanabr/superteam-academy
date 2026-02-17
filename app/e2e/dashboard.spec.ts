import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("displays stats cards", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.getByText(/XP/i).first()).toBeVisible();
  });

  test("shows streak calendar", async ({ page }) => {
    await page.goto("/en/dashboard");
    const streakSection = page.getByText(/streak/i).first();
    await expect(streakSection).toBeVisible();
  });

  test("shows active courses", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.getByText(/continue/i).first()).toBeVisible();
  });
});

test.describe("Leaderboard", () => {
  test("displays rankings", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await expect(page.getByText("#1").first()).toBeVisible();
  });

  test("switches timeframes", async ({ page }) => {
    await page.goto("/en/leaderboard");
    const monthlyTab = page.getByRole("tab", { name: /monthly/i });
    if (await monthlyTab.isVisible()) {
      await monthlyTab.click();
    }
  });
});
