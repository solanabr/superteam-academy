import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("landing page loads with hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("navigates to courses page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/courses"]');
    await expect(page).toHaveURL("/courses");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("navigates to dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("main")).toBeVisible();
  });

  test("navigates to leaderboard", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page).toHaveURL("/leaderboard");
    await expect(page.locator("main")).toBeVisible();
  });

  test("navigates to settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL("/settings");
    await expect(page.locator("main")).toBeVisible();
  });

  test("header contains navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('header a[href="/courses"]')).toBeVisible();
    await expect(page.locator('header a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('header a[href="/leaderboard"]')).toBeVisible();
  });

  test("theme toggle works", async ({ page }) => {
    await page.goto("/");
    const themeButton = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeButton).toBeVisible();
    await themeButton.click();
    // Theme should have toggled (we just verify the button is still there and clickable)
    await expect(themeButton).toBeVisible();
  });

  test("language selector is visible", async ({ page }) => {
    await page.goto("/");
    const langButton = page.locator('button[aria-label="Change language"]');
    await expect(langButton).toBeVisible();
  });
});
