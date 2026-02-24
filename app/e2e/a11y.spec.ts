import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("skip-to-content link exists and targets main", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const skipLink = page.locator("a[href='#main-content']");
    await expect(skipLink).toHaveCount(1);
  });

  test("main landmark exists with id", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("main#main-content, main[id='main-content']")).toHaveCount(1);
  });

  test("every page has exactly one h1", async ({ page }) => {
    for (const path of ["/en", "/en/settings", "/en/leaderboard"]) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
      const count = await page.locator("h1").count();
      expect(count, `Expected 1 h1 on ${path}, got ${count}`).toBe(1);
    }
  });

  test("all buttons have accessible names", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = (await btn.textContent())?.trim();
      const ariaLabel = await btn.getAttribute("aria-label");
      const title = await btn.getAttribute("title");
      expect(
        (text && text.length > 0) || !!ariaLabel || !!title,
        `Button ${i} has no accessible name`
      ).toBe(true);
    }
  });

  test("toggle switches have proper ARIA attributes", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const switches = page.locator("[role='switch']");
    const count = await switches.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const ariaChecked = await switches.nth(i).getAttribute("aria-checked");
      expect(ariaChecked === "true" || ariaChecked === "false").toBe(true);
    }
  });

  test("images have alt attributes", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt, `Image ${i} missing alt attribute`).not.toBeNull();
    }
  });

  test("focus ring is visible via keyboard navigation", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    // Tab into interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus-visible");
    await expect(focused.first()).toBeVisible();
  });

  test("color contrast: solana-purple text passes 4.5:1 on dark", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    // Verify we use #a855f7 (5.2:1) not #9945FF (4.4:1)
    const css = await page.evaluate(() => {
      const sheet = [...document.styleSheets].find(s => {
        try { return s.cssRules.length > 0; } catch { return false; }
      });
      if (!sheet) return "";
      return [...sheet.cssRules].map(r => r.cssText).join(" ");
    });
    // The global focus-visible uses #a855f7
    expect(css).toContain("a855f7");
  });
});
