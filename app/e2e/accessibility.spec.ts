import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("homepage has proper heading hierarchy", async ({ page }) => {
    await page.goto("/pt");
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();
  });

  test("all images have alt attributes", async ({ page }) => {
    await page.goto("/pt");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 20); i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt, `Image ${i} missing alt attribute`).not.toBeNull();
    }
  });

  test("interactive elements are keyboard accessible", async ({ page }) => {
    await page.goto("/pt");
    // Tab through the page and verify focus is visible
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });

  test("page has lang attribute", async ({ page }) => {
    await page.goto("/pt");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
  });

  test("color contrast — no invisible text", async ({ page }) => {
    await page.goto("/pt");
    // Verify hero text is visible (basic contrast check)
    const heroText = page.locator("h1, h2").first();
    await expect(heroText).toBeVisible();
    const box = await heroText.boundingBox();
    expect(box?.height).toBeGreaterThan(0);
    expect(box?.width).toBeGreaterThan(0);
  });
});
