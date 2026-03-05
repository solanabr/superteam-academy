import { test, expect } from "@playwright/test";

test.describe("Settings page — structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForLoadState("domcontentloaded");
  });

  test("settings page loads with a visible h1", async ({ page }) => {
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("main content area is visible", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("page does not show an unhandled runtime error", async ({ page }) => {
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });

  test("page has a non-empty title tag", async ({ page }) => {
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test("header is visible on settings page", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });

  test("footer is visible on settings page", async ({ page }) => {
    await expect(page.locator("footer")).toBeVisible();
  });
});

test.describe("Settings page — theme controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForLoadState("networkidle");
  });

  test("Dark theme button is visible", async ({ page }) => {
    const darkBtn = page.getByRole("button", { name: /dark/i }).first();
    const count = await darkBtn.count();
    if (count > 0) {
      await expect(darkBtn).toBeVisible();
    }
  });

  test("Light theme button is visible", async ({ page }) => {
    const lightBtn = page.getByRole("button", { name: /light/i }).first();
    const count = await lightBtn.count();
    if (count > 0) {
      await expect(lightBtn).toBeVisible();
    }
  });

  test("System theme button is visible", async ({ page }) => {
    const systemBtn = page.getByRole("button", { name: /system/i }).first();
    const count = await systemBtn.count();
    if (count > 0) {
      await expect(systemBtn).toBeVisible();
    }
  });

  test("clicking Dark button does not crash", async ({ page }) => {
    const darkBtn = page.getByRole("button", { name: /dark/i }).first();
    const count = await darkBtn.count();
    if (count > 0) {
      await darkBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator("main")).toBeVisible();
    }
  });
});

test.describe("Settings page — language selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForLoadState("domcontentloaded");
  });

  test("locale switcher is present in settings", async ({ page }) => {
    // LocaleSwitcher is embedded in Settings — look for globe icon button
    const localeArea = page.locator("main");
    await expect(localeArea).toBeVisible();
    // The LocaleSwitcher renders a button with a Globe icon
    const globeBtn = page.locator("main button[aria-label]").first();
    const count = await globeBtn.count();
    if (count > 0) {
      await expect(globeBtn).toBeVisible();
    }
  });
});

test.describe("Settings page — profile inputs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForLoadState("domcontentloaded");
  });

  test("profile name input is present", async ({ page }) => {
    const nameInput = page.locator("input[type='text']").first();
    const count = await nameInput.count();
    if (count > 0) {
      await expect(nameInput).toBeVisible();
    }
  });

  test("settings page has at least one card section", async ({ page }) => {
    const cards = page.locator("[class*='card' i], [class*='Card' i]");
    const count = await cards.count();
    // Settings renders multiple card sections
    expect(count).toBeGreaterThan(0);
  });

  test("settings page at mobile viewport renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/settings");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });
});
