import { test, expect } from "@playwright/test";

test.describe("Theme System", () => {
  test("default theme is dark", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);
    // next-themes sets data-theme or class on html
    const html = page.locator("html");
    const classes = await html.getAttribute("class");
    const dataTheme = await html.getAttribute("data-theme");
    expect(classes?.includes("dark") || dataTheme === "dark").toBe(true);
  });

  test("switching theme updates html attribute", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);

    // Find and click the Light button
    const lightBtn = page.locator("button").filter({ hasText: /^Light$|^Claro$/ });
    if ((await lightBtn.count()) > 0) {
      await lightBtn.first().click();
      await page.waitForTimeout(500);
      const html = page.locator("html");
      const classes = await html.getAttribute("class");
      const dataTheme = await html.getAttribute("data-theme");
      expect(classes?.includes("light") || dataTheme === "light").toBe(true);
    }
  });

  test("theme persists on page reload", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);

    // Switch to light
    const lightBtn = page.locator("button").filter({ hasText: /^Light$|^Claro$/ });
    if ((await lightBtn.count()) > 0) {
      await lightBtn.first().click();
      await page.waitForTimeout(500);

      // Reload
      await page.reload();
      await page.waitForTimeout(2000);
      const html = page.locator("html");
      const classes = await html.getAttribute("class");
      const dataTheme = await html.getAttribute("data-theme");
      expect(classes?.includes("light") || dataTheme === "light").toBe(true);
    }
  });

  test("CSS custom properties change with theme", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);

    // Get dark theme bg
    const darkBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--bg-primary").trim()
    );

    // Switch to light
    const lightBtn = page.locator("button").filter({ hasText: /^Light$|^Claro$/ });
    if ((await lightBtn.count()) > 0) {
      await lightBtn.first().click();
      await page.waitForTimeout(500);

      const lightBg = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--bg-primary").trim()
      );
      // Values should differ between themes
      if (darkBg && lightBg) {
        expect(darkBg).not.toBe(lightBg);
      }
    }
  });
});
