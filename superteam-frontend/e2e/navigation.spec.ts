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

  test("navbar shows theme toggle", async ({ page }) => {
    await page.goto("/");
    const themeBtn = page
      .locator("button")
      .filter({ has: page.locator("svg") });
    expect(await themeBtn.count()).toBeGreaterThan(0);
  });
});

test.describe("Responsive design", () => {
  test("mobile: hamburger menu appears", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const menuBtn = page
      .locator("button[aria-label]")
      .or(page.locator("[data-testid='mobile-menu']"));
    expect(await menuBtn.count()).toBeGreaterThan(0);
  });
});
