import { test, expect } from "@playwright/test";

test.describe("Gamification — XP & Progress", () => {
  test("dashboard shows XP display", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();

    const xpValues = page.getByText(/xp/i);
    await expect(xpValues.first()).toBeVisible();
  });

  test("dashboard shows level indicator", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();

    const levelText = page.getByText(/level/i);
    await expect(levelText.first()).toBeVisible();
  });

  test("dashboard shows streak info", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();

    const streakText = page.getByText(/streak/i);
    await expect(streakText.first()).toBeVisible();
  });

  test("dashboard shows achievement section", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();

    const achievementsSection = page.getByText(/achievement/i);
    await expect(achievementsSection.first()).toBeVisible();
  });

  test("profile page shows achievement grid", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.locator("main")).toBeVisible();

    const achievementsSection = page.getByText(/achievement|badge/i);
    await expect(achievementsSection.first()).toBeVisible();
  });

  test("sidebar has dashboard link on app pages", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("h1")).toBeVisible();

    const dashboardLink = page.locator('a[href="/dashboard"]');
    const count = await dashboardLink.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("leaderboard accessible from sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();

    const leaderboardLink = page.locator('a[href="/leaderboard"]');
    await expect(leaderboardLink.first()).toBeVisible();
  });
});
