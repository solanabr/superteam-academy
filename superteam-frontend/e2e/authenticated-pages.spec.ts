import { test, expect } from "./fixtures/auth";

test.describe("Courses (authenticated)", () => {
  test("course catalog loads with cards", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/courses");
    await expect(page.locator("h1")).toContainText(/course/i);
    const cards = page.locator("[class*='card'], [class*='Card']");
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("course detail page renders", async ({ authenticatedPage: page }) => {
    await page.goto("/courses");
    await page.waitForLoadState("networkidle");
    // Click the first course link
    const firstCourseLink = page.locator("a[href^='/courses/']").first();
    if (await firstCourseLink.isVisible()) {
      await firstCourseLink.click();
      await page.waitForLoadState("networkidle");
      // Should be on a course detail page
      expect(page.url()).toContain("/courses/");
    }
  });
});

test.describe("Dashboard (authenticated)", () => {
  test("dashboard renders stats and content", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Dashboard should not redirect back to /
    expect(page.url()).toContain("/dashboard");
    // Should have some visible content
    const main = page.locator("main");
    await expect(main).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Leaderboard (authenticated)", () => {
  test("leaderboard table renders", async ({ authenticatedPage: page }) => {
    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/leaderboard");
    // Leaderboard should have visible content
    const content = page
      .locator("main, [class*='leaderboard'], table, [role='table']")
      .first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Profile (authenticated)", () => {
  test("profile page renders", async ({ authenticatedPage: page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/profile");
    const content = page.locator("main").first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Settings (authenticated)", () => {
  test("settings page loads", async ({ authenticatedPage: page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/settings");
    const content = page.locator("main").first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });
});
