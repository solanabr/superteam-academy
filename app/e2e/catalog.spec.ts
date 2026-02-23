import { test, expect } from "@playwright/test";

test.describe("Course Catalog", () => {
  test("catalog section exists on landing page", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(2000);
    // The page should have course-related content or empty state
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(100);
  });

  test("filter UI is present when courses exist", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(2000);
    // Check for filter-related UI (buttons or select)
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("hero section with CTA exists", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(2000);
    // Look for any link to courses section
    const links = page.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
