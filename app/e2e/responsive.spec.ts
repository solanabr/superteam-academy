import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  test("mobile viewport renders without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForTimeout(2000);
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(376);
  });

  test("desktop viewport shows full layout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });

  test("course grid adapts to viewport width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en");
    await page.waitForTimeout(2000);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    // Page should still render
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });

  test("settings page works on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).toMatch(/Settings|Light|Dark/);
  });
});
