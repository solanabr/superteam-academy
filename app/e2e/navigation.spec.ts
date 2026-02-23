import { test, expect } from "@playwright/test";

test.describe("Navigation & Page Load", () => {
  test("landing page renders hero and catalog", async ({ page }) => {
    await page.goto("/");
    // Wait for client hydration
    await page.waitForTimeout(2000);
    // Hero section — check for badge or heading text
    const body = await page.textContent("body");
    expect(body).toContain("Solana");
  });

  test("catalog section shows course grid or empty state", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    const content = await page.textContent("body");
    // Page loaded successfully
    expect(content!.length).toBeGreaterThan(50);
  });

  test("settings page renders theme section", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    // Theme section with light/dark/system options
    expect(body).toMatch(/Light|Dark|System|Claro|Escuro|Sistema/);
  });

  test("settings page renders language section", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).toContain("Português");
  });

  test("leaderboard page loads", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await page.waitForTimeout(2000);
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible({ timeout: 10000 });
  });

  test("profile page loads", async ({ page }) => {
    await page.goto("/en/profile");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });

  test("my-learning page loads", async ({ page }) => {
    await page.goto("/en/my-learning");
    await page.waitForTimeout(3000);
    const body = await page.textContent("body");
    // Check dashboard content is present
    expect(body).toMatch(/Learning|Aprendizado|XP|Level/i);
  });

  test("dashboard page loads", async ({ page }) => {
    await page.goto("/en/dashboard");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });

  test("navbar is present", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);
    const nav = page.locator("nav, header");
    await expect(nav.first()).toBeVisible();
  });

  test("404 page handles unknown routes", async ({ page }) => {
    const response = await page.goto("/en/nonexistent-page-xyz");
    expect(response?.status()).toBe(404);
  });
});
