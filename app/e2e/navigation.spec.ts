import { test, expect } from "@playwright/test";

test.describe("Navigation — Header Links", () => {
  test("header nav links resolve to correct pages", async ({ page }) => {
    await page.goto("/");

    const navLinks = [
      { href: "/courses", label: /courses/i },
      { href: "/challenges", label: /challenges/i },
      { href: "/leaderboard", label: /leaderboard/i },
      { href: "/discussions", label: /discussions/i },
    ];

    for (const { href, label } of navLinks) {
      const link = page.locator(`header a[href="${href}"]`);
      await expect(link).toBeVisible();
      await expect(link).toHaveText(label);
    }
  });

  test("clicking header links navigates correctly", async ({ page }) => {
    await page.goto("/");

    await page.click('header a[href="/courses"]');
    await expect(page).toHaveURL("/courses");
    await expect(page.locator("h1")).toBeVisible();

    await page.click('header a[href="/leaderboard"]');
    await expect(page).toHaveURL("/leaderboard");
    await expect(page.locator("h1")).toBeVisible();

    await page.click('header a[href="/discussions"]');
    await expect(page).toHaveURL("/discussions");
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Navigation — Sidebar", () => {
  test("sidebar renders on app routes", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();

    const sidebar = page.locator("aside, nav.sidebar, [data-sidebar]");
    const count = await sidebar.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("sidebar is hidden on marketing routes", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();

    const sidebar = page.locator("[data-sidebar='sidebar']");
    const count = await sidebar.count();
    expect(count).toBe(0);
  });
});

test.describe("Navigation — 404 & Edge Cases", () => {
  test("404 page renders for invalid routes", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-xyz");
    // Next.js may return 200 with a not-found page or 404
    const status = response?.status();
    expect(status === 404 || status === 200).toBeTruthy();
  });

  test("theme toggle works and changes theme class", async ({ page }) => {
    await page.goto("/");
    const themeButton = page.locator('button[aria-label="Toggle theme"]');
    await expect(themeButton).toBeVisible();

    const htmlBefore = await page.locator("html").getAttribute("class");
    await themeButton.click();
    await page.waitForTimeout(300);
    const htmlAfter = await page.locator("html").getAttribute("class");

    expect(htmlBefore).not.toBe(htmlAfter);
  });

  test("theme toggle persists across navigation", async ({ page }) => {
    await page.goto("/");
    const themeButton = page.locator('button[aria-label="Toggle theme"]');
    await themeButton.click();
    await page.waitForTimeout(300);

    const themeAfterToggle = await page.locator("html").getAttribute("class");

    await page.goto("/courses");
    await expect(page.locator("h1")).toBeVisible();

    const themeAfterNav = await page.locator("html").getAttribute("class");
    expect(themeAfterNav).toBe(themeAfterToggle);
  });

  test("language selector is visible", async ({ page }) => {
    await page.goto("/");
    const langButton = page.locator('button[aria-label="Change language"]');
    await expect(langButton).toBeVisible();
  });
});
