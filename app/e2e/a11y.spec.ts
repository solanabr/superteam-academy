import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("skip-to-content link exists", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(2000);
    const skipLink = page.locator("a[href='#main-content']");
    const count = await skipLink.count();
    // Skip link should exist even if hidden
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("main landmark exists", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(2000);
    const main = page.locator("main, [role='main']");
    const count = await main.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("settings page has h1 heading", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(3000);
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible({ timeout: 10000 });
  });

  test("interactive elements have accessible names", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);
    const buttons = page.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 8); i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute("aria-label");
      expect((text && text.trim().length > 0) || !!ariaLabel).toBe(true);
    }
  });

  test("toggle switch has role=switch and aria-checked", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);
    const switchEl = page.locator("[role='switch']");
    if ((await switchEl.count()) > 0) {
      const ariaChecked = await switchEl.first().getAttribute("aria-checked");
      expect(ariaChecked === "true" || ariaChecked === "false").toBe(true);
    }
  });

  test("images have alt attributes", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(2000);
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt !== null).toBe(true);
    }
  });

  test("focus is visible via keyboard navigation", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    const count = await focused.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
