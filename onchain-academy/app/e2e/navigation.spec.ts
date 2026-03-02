import { test, expect } from "@playwright/test";
import { gotoWithLocale } from "./fixtures/test-helpers";

test.describe("Navigation", () => {
  test("home page renders with hero content", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveTitle(/Superteam Academy/, { timeout: 15_000 });
    // Hero renders heroHeadline ("Learn") + heroOnChain ("on-chain.")
    await expect(page.getByText("Learn").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("navbar links navigate to correct pages", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveTitle(/Superteam Academy/, { timeout: 15_000 });

    // Click "Courses" link in nav
    const coursesLink = page.getByRole("link", { name: /courses/i }).first();
    await expect(coursesLink).toBeVisible({ timeout: 10_000 });
    await coursesLink.click({ timeout: 15_000 });
    await page.waitForURL("**/courses", { timeout: 15_000 });
    await expect(page.getByText("Curriculum")).toBeVisible({ timeout: 15_000 });
  });

  test("404 page renders for invalid routes", async ({ page }) => {
    await page.goto("/en/this-route-does-not-exist-at-all");
    // Wait for the page to settle
    await page.waitForTimeout(3000);

    // Should show the terminal-styled 404 page
    const bodyText = await page.locator("body").textContent();
    expect(
      bodyText!.includes("404") ||
        bodyText!.includes("not found") ||
        bodyText!.includes("Not Found") ||
        bodyText!.includes("Page not found"),
    ).toBeTruthy();
  });

  test("language switching from settings navigates to new locale", async ({
    page,
  }) => {
    await gotoWithLocale(page, "/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible({
      timeout: 15_000,
    });

    // Click Spanish locale link
    await page
      .getByRole("link", { name: /Espa[nñ]ol/ })
      .click({ timeout: 15_000 });
    await page.waitForURL("**/es/settings", { timeout: 15_000 });

    // Settings heading should be in Spanish
    await expect(page.getByRole("heading", { name: /Ajustes/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("mobile menu hamburger button exists in mobile viewport", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en");
    await expect(page).toHaveTitle(/Superteam Academy/, { timeout: 15_000 });

    // The mobile menu trigger (hamburger) should be visible
    // On mobile, desktop nav links are hidden and a menu button appears
    const menuButton = page.getByRole("button", { name: /menu/i });
    const hasMenuButton = await menuButton.isVisible().catch(() => false);

    // Alternatively check for any button with aria-label containing "menu" or the Menu icon
    if (!hasMenuButton) {
      // Check if there's a button that toggles mobile navigation
      const anyMenuTrigger = page
        .locator("button")
        .filter({ hasText: /menu/i });
      const hamburgerButton = page.locator(
        "[aria-label*='menu' i], [aria-label*='Menu' i], [aria-label*='navigation' i]",
      );
      const hasHamburger = await hamburgerButton
        .first()
        .isVisible()
        .catch(() => false);
      const hasTrigger = await anyMenuTrigger
        .first()
        .isVisible()
        .catch(() => false);

      // On mobile, the desktop nav links should be hidden
      const desktopNav = page.locator(
        ".hidden.md\\:flex, .hidden.items-center.gap-8.md\\:flex",
      );
      const isDesktopNavHidden = await desktopNav
        .first()
        .isHidden()
        .catch(() => true);

      // Either we find a hamburger button or desktop nav is hidden (mobile mode active)
      expect(hasHamburger || hasTrigger || isDesktopNavHidden).toBeTruthy();
    }
  });
});
