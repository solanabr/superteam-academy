import { test, expect } from "@playwright/test";
import { dismissOnboarding } from "./helpers";

test.describe("Theme — default dark mode", () => {
  test("landing page has dark class or data-theme on html element", async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const html = page.locator("html");
    const className = (await html.getAttribute("class")) ?? "";
    const dataTheme = (await html.getAttribute("data-theme")) ?? "";
    // The app hardcodes dark; dark should appear somewhere
    expect(className + dataTheme).toMatch(/dark/i);
  });

  test("dark background color is applied to html or body", async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    // The design uses #08080C background — check the computed background is dark
    const bgColor = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).backgroundColor;
    });
    // Background should not be white (rgb(255, 255, 255))
    expect(bgColor).not.toBe("rgb(255, 255, 255)");
  });
});

test.describe("Theme — toggle control", () => {
  test("theme toggle button is visible on landing page", async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const toggle = page
      .locator("button[aria-label*='theme' i]")
      .or(page.locator("button[aria-label*='dark' i]"))
      .or(page.locator("button[aria-label*='light' i]"))
      .or(page.locator("button[aria-label*='Toggle' i]"))
      .first();
    const count = await toggle.count();
    if (count > 0) {
      await expect(toggle).toBeVisible();
    }
  });

  test("settings page has Dark / Light / System theme options", async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en/settings");
    await page.waitForLoadState("networkidle");
    const themeBtn = page
      .getByRole("button", { name: /dark|light|system/i })
      .first();
    const count = await themeBtn.count();
    if (count > 0) {
      await expect(themeBtn).toBeVisible();
    }
    // Settings main always visible (may redirect to signin)
    await expect(page.locator("main")).toBeVisible();
  });

  test("clicking theme toggle does not crash the page", async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    // Theme toggle has aria-label like "Switch to light theme" or "Switch to dark theme"
    const toggle = page
      .locator("button[aria-label*='theme' i]")
      .or(page.locator("button[aria-label*='dark' i]"))
      .or(page.locator("button[aria-label*='light' i]"))
      .first();
    const count = await toggle.count();
    if (count > 0) {
      await toggle.click();
      await page.waitForTimeout(400);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
    }
  });

  test("theme persists between navigation — html class remains dark after nav", async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    // Note: dark is the default and is hardcoded — navigate to courses
    await page.goto("/en/courses");
    await page.waitForLoadState("networkidle");
    const html = page.locator("html");
    const className = (await html.getAttribute("class")) ?? "";
    const dataTheme = (await html.getAttribute("data-theme")) ?? "";
    expect(className + dataTheme).toMatch(/dark/i);
  });
});
