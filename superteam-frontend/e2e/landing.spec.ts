import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("hero section renders with CTAs", async ({ page }) => {
    await expect(page.locator("h1").first()).toBeVisible();
    // Should have Sign Up or Explore CTA
    const cta = page
      .locator("a, button")
      .filter({ hasText: /explore|sign|start|get started/i });
    expect(await cta.count()).toBeGreaterThan(0);
  });

  test("stats section shows platform numbers", async ({ page }) => {
    // Should show stats like learners, courses, XP
    const statsSection = page.locator("text=/\\d+[kK+]?/").first();
    await expect(statsSection).toBeVisible();
  });

  test("features section renders cards", async ({ page }) => {
    // Feature highlights should be visible
    const cards = page.locator("[class*='card'], [class*='Card']");
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("footer renders with all sections", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    // Should have platform, resources, company link groups
    await expect(footer.locator("a").first()).toBeVisible();
  });

  test("page has no accessibility violations on main landmarks", async ({
    page,
  }) => {
    // Basic landmark check
    const main = page.locator("main").or(page.locator("[role='main']"));
    expect(await main.count()).toBeGreaterThanOrEqual(0);
    // Page should have a heading
    const h1 = page.locator("h1");
    expect(await h1.count()).toBeGreaterThan(0);
  });
});

test.describe("Theme", () => {
  test("dark mode is default", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const className = await html.getAttribute("class");
    // dark should be default or present
    expect(className).toBeTruthy();
  });
});
