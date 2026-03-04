import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("hero section renders with heading", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();

    const heroHeading = page.locator("h1").first();
    await expect(heroHeading).toBeVisible();
  });

  test("CTA buttons link correctly", async ({ page }) => {
    // "Start Learning" → /onboarding
    const startCta = page
      .locator("a")
      .filter({ hasText: /get started|start learning/i })
      .first();
    await expect(startCta).toBeVisible();
    const startHref = await startCta.getAttribute("href");
    expect(startHref).toMatch(/\/(onboarding|courses)/);

    // "Explore Courses" → /courses
    const exploreCta = page
      .locator("a")
      .filter({ hasText: /explore courses/i })
      .first();
    await expect(exploreCta).toBeVisible();
    const exploreHref = await exploreCta.getAttribute("href");
    expect(exploreHref).toBe("/courses");
  });

  test("stats section shows real numbers", async ({ page }) => {
    const statsLabels = [/learners/i, /courses/i, /credentials/i];
    for (const label of statsLabels) {
      const stat = page.getByText(label);
      await expect(stat.first()).toBeVisible();
    }
  });

  test("featured course cards visible", async ({ page }) => {
    const courseLinks = page.locator('a[href^="/courses/"]');
    const count = await courseLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("footer links present", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const footerLinks = footer.locator("a");
    const count = await footerLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("responsive: mobile menu toggle button exists", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator("h1").first()).toBeVisible();

    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    await expect(menuButton).toBeVisible();

    await menuButton.click();
    await page.waitForTimeout(300);

    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });
});
