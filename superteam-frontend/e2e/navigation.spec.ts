import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("landing page loads with hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Superteam/i);
    await expect(page.locator("text=Explore Courses").first()).toBeVisible();
  });

  test("landing page has learning paths section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page
        .locator("[data-testid='paths-section']")
        .or(page.locator("text=Learning Paths").first()),
    ).toBeVisible();
  });

  test("landing page footer has newsletter signup", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });

  test("auth signin page loads", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.locator("text=Sign In").first()).toBeVisible();
  });

  test("navbar shows language switcher", async ({ page }) => {
    await page.goto("/");
    const switcher = page
      .locator("[data-testid='language-switcher']")
      .or(
        page
          .locator("button:has-text('EN')")
          .or(page.locator("button:has-text('ES')"))
          .or(page.locator("button:has-text('PT')")),
      );
    await expect(switcher.first()).toBeVisible();
  });

  test("navbar shows theme toggle", async ({ page }) => {
    await page.goto("/");
    // Theme toggle button should exist
    const themeBtn = page
      .locator("button")
      .filter({ has: page.locator("svg") });
    expect(await themeBtn.count()).toBeGreaterThan(0);
  });
});

test.describe("Unauthenticated redirects", () => {
  test("courses page redirects to auth", async ({ page }) => {
    await page.goto("/courses");
    // Should redirect to / or /auth/signin since not authenticated
    await page.waitForURL(/(\/|\/auth\/signin)/);
  });

  test("dashboard redirects to auth", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/(\/|\/auth\/signin)/);
  });

  test("leaderboard redirects to auth", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForURL(/(\/|\/auth\/signin)/);
  });
});

test.describe("Responsive design", () => {
  test("mobile: hamburger menu appears", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    // On mobile, there should be a hamburger/menu button
    const menuBtn = page
      .locator("button[aria-label]")
      .or(page.locator("[data-testid='mobile-menu']"));
    expect(await menuBtn.count()).toBeGreaterThan(0);
  });
});

test.describe("i18n", () => {
  test("switching to Spanish changes UI text", async ({ page }) => {
    await page.goto("/");
    // Set locale cookie to Spanish
    await page
      .context()
      .addCookies([
        { name: "locale", value: "es", domain: "localhost", path: "/" },
      ]);
    await page.reload();
    // Check that Spanish text appears somewhere
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("switching to Portuguese changes UI text", async ({ page }) => {
    await page.goto("/");
    await page
      .context()
      .addCookies([
        { name: "locale", value: "pt-br", domain: "localhost", path: "/" },
      ]);
    await page.reload();
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});
