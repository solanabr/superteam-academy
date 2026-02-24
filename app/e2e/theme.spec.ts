import { test, expect } from "@playwright/test";

test.describe("Theme System", () => {
  test("default theme is dark", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);
  });

  test("switching to light theme updates html class", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });

    await page.locator("button").filter({ hasText: "Light" }).first().click();
    await expect(page.locator("html")).toHaveClass(/light/);
  });

  test("theme persists on reload", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });

    await page.locator("button").filter({ hasText: "Light" }).first().click();
    await expect(page.locator("html")).toHaveClass(/light/);

    await page.reload();
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("html")).toHaveClass(/light/);
  });

  test("CSS custom properties differ between themes", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });

    const darkBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--bg-primary").trim()
    );

    await page.locator("button").filter({ hasText: "Light" }).first().click();
    await page.waitForTimeout(300);

    const lightBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--bg-primary").trim()
    );

    expect(darkBg).not.toBe(lightBg);
  });

  test("switching back to dark works", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });

    await page.locator("button").filter({ hasText: "Light" }).first().click();
    await expect(page.locator("html")).toHaveClass(/light/);

    await page.locator("button").filter({ hasText: "Dark" }).first().click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
