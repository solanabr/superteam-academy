import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();
  });

  test("dashboard loads with heading", async ({ page }) => {
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });

  test("XP section visible", async ({ page }) => {
    const xpText = page.getByText(/xp/i);
    await expect(xpText.first()).toBeVisible();
  });

  test("level indicator visible", async ({ page }) => {
    const levelText = page.getByText(/level/i);
    await expect(levelText.first()).toBeVisible();
  });

  test("streak section visible", async ({ page }) => {
    const streakText = page.getByText(/streak/i);
    await expect(streakText.first()).toBeVisible();
  });

  test("achievements section visible", async ({ page }) => {
    const achievementsSection = page.getByText(/achievement/i);
    await expect(achievementsSection.first()).toBeVisible();
  });

  test("recommended courses section visible", async ({ page }) => {
    const recommendedSection = page.getByText(/recommended/i);
    await expect(recommendedSection.first()).toBeVisible();
  });

  test("sidebar navigation present", async ({ page }) => {
    const dashboardLink = page.locator('a[href="/dashboard"]');
    const count = await dashboardLink.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const coursesLink = page.locator('a[href="/courses"]');
    await expect(coursesLink.first()).toBeVisible();
  });
});
