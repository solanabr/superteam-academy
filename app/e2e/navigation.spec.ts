import { test, expect } from "@playwright/test";

test.describe("Navigation & Page Load", () => {
  test("landing page renders hero heading and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/On-Chain/);
    await expect(page.locator('a[href*="courses"], a[href*="#courses"]').first()).toBeVisible();
  });

  test("landing page renders feature cards section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=On-Chain Verified").first()).toBeVisible();
    await expect(page.locator("text=XP Tokens").first()).toBeVisible();
  });

  test("catalog section renders on landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    // Catalog heading or course cards
    await expect(page.locator("text=Course Catalog").or(page.locator("text=No courses available")).first()).toBeVisible();
  });

  test("footer renders with links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("footer").first()).toContainText("Superteam");
  });

  test("navbar is present with logo and wallet button", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav, header").first()).toBeVisible({ timeout: 15000 });
    // Wallet connect button from wallet adapter
    await expect(page.locator("button").filter({ hasText: /Connect|Select Wallet|Wallet/ }).first()).toBeVisible();
  });

  test("settings page renders all sections", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toContainText("Settings", { timeout: 15000 });
    // Theme section
    await expect(page.locator("button").filter({ hasText: "Light" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "Dark" }).first()).toBeVisible();
    await expect(page.locator("button").filter({ hasText: "System" }).first()).toBeVisible();
    // Language section — locale buttons in settings page
    await expect(page.locator("main button").filter({ hasText: "English" }).first()).toBeVisible();
  });

  test("leaderboard page renders heading and content", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await expect(page.locator("h1")).toContainText("Leaderboard", { timeout: 15000 });
    // Leaderboard shows filter buttons, table skeleton, or "no data" message
    await expect(
      page.locator("button").filter({ hasText: "All Time" })
        .or(page.locator("text=No leaderboard data"))
        .or(page.locator("[class*=skeleton], [class*=animate-pulse]"))
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("profile page shows connect wallet prompt", async ({ page }) => {
    await page.goto("/en/profile");
    // Without wallet connected, should show connect prompt
    await expect(page.locator("text=Connect").first()).toBeVisible({ timeout: 15000 });
  });

  test("my-learning page shows connect wallet prompt or dashboard", async ({ page }) => {
    await page.goto("/en/my-learning");
    // Without wallet: connect prompt. With wallet: dashboard heading.
    await expect(
      page.locator("main").locator("text=Connect").or(page.locator("main h1")).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("creator dashboard page loads", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.locator("main h1").or(page.locator("main h2")).first()).toBeVisible({ timeout: 15000 });
  });

  test("404 returns not-found status", async ({ page }) => {
    const response = await page.goto("/en/nonexistent-page-xyz");
    expect(response?.status()).toBe(404);
  });

  test("course detail page loads for known course", async ({ page }) => {
    await page.goto("/en/courses/solana-101");
    // Page should load with content (course info or connect wallet or skeleton)
    await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
    const content = await page.textContent("body");
    expect(content!.length).toBeGreaterThan(100);
  });

  test("lesson page loads for known course", async ({ page }) => {
    await page.goto("/en/courses/solana-101/lessons/0");
    // Should show lesson content or loading skeleton
    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: 15000 });
    // Lesson page should have content beyond just the nav
    const content = await body.textContent();
    expect(content!.length).toBeGreaterThan(100);
  });
});
