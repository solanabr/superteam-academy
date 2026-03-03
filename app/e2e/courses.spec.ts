import { test, expect } from "@playwright/test";

test.describe("Courses", () => {
  test("course catalog loads with courses", async ({ page }) => {
    await page.goto("/courses");
    // Should have course cards
    const courseCards = page.locator('a[href^="/courses/"]');
    await expect(courseCards.first()).toBeVisible();
    const count = await courseCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("search filters courses", async ({ page }) => {
    await page.goto("/courses");
    const searchInput = page.locator('input[type="text"]');
    await searchInput.fill("Anchor");
    // Wait for filter to apply
    await page.waitForTimeout(300);
    const courseCards = page.locator('a[href^="/courses/"]');
    const count = await courseCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("search with no results shows empty state", async ({ page }) => {
    await page.goto("/courses");
    const searchInput = page.locator('input[type="text"]');
    await searchInput.fill("xyznonexistentcourse123");
    await page.waitForTimeout(300);
    const courseCards = page.locator('a[href^="/courses/"]');
    const count = await courseCards.count();
    expect(count).toBe(0);
  });

  test("difficulty filter pills work", async ({ page }) => {
    await page.goto("/courses");
    // Click beginner filter
    const beginnerButton = page
      .locator("button")
      .filter({ hasText: /beginner/i })
      .first();
    await beginnerButton.click();
    await page.waitForTimeout(300);
    // Should still have some courses
    const courseCards = page.locator('a[href^="/courses/"]');
    const count = await courseCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("course detail page loads", async ({ page }) => {
    await page.goto("/courses/intro-to-solana");
    await expect(page.locator("main")).toBeVisible();
    // Should have course title visible somewhere
    await expect(page.locator("h1")).toBeVisible();
  });

  test("course detail has enroll button", async ({ page }) => {
    await page.goto("/courses/intro-to-solana");
    // Look for enroll or continue learning button
    const actionButton = page
      .locator("button, a")
      .filter({ hasText: /enroll|continue|start/i })
      .first();
    await expect(actionButton).toBeVisible();
  });
});

test.describe("Leaderboard", () => {
  test("leaderboard loads with entries", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.locator("main")).toBeVisible();
    // Should have leaderboard heading
    await expect(page.locator("h1")).toBeVisible();
  });

  test("time filter tabs are present", async ({ page }) => {
    await page.goto("/leaderboard");
    // Should have filter buttons for time periods
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

test.describe("Settings", () => {
  test("settings page has tabs", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("main")).toBeVisible();
    // Should have tab navigation
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

test.describe("Certificate", () => {
  test("valid certificate loads", async ({ page }) => {
    await page.goto("/certificates/cert-anchor-fundamentals-001");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("invalid certificate returns 404", async ({ page }) => {
    const response = await page.goto("/certificates/nonexistent-cert-xyz");
    expect(response?.status()).toBe(404);
  });
});
