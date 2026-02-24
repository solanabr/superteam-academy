import { test, expect } from "@playwright/test";

test.describe("Onboarding Modal", () => {
  test("welcome modal shows on first visit", async ({ page }) => {
    // Clear localStorage to simulate first visit
    await page.goto("/en");
    await page.evaluate(() => localStorage.removeItem("superteam-onboarding-seen"));
    await page.reload();
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });

    // Modal should appear
    await expect(page.locator("text=Welcome to Superteam Academy").first()).toBeVisible({ timeout: 5000 });
    // Steps should be visible
    await expect(page.locator("text=Connect your Solana wallet").first()).toBeVisible();
    await expect(page.locator("text=Browse Courses").first()).toBeVisible();
  });

  test("welcome modal can be dismissed", async ({ page }) => {
    await page.goto("/en");
    await page.evaluate(() => localStorage.removeItem("superteam-onboarding-seen"));
    await page.reload();
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });

    // Wait for modal
    await expect(page.locator("text=Welcome to Superteam Academy").first()).toBeVisible({ timeout: 5000 });

    // Close button (X)
    await page.locator("button[aria-label='Close']").click();

    // Modal should disappear
    await expect(page.locator("text=Welcome to Superteam Academy")).not.toBeVisible({ timeout: 3000 });
  });

  test("welcome modal does not show on repeat visit", async ({ page }) => {
    await page.goto("/en");
    // Set the seen flag
    await page.evaluate(() => localStorage.setItem("superteam-onboarding-seen", "1"));
    await page.reload();
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });

    // Modal should NOT appear
    await expect(page.locator("text=Welcome to Superteam Academy")).not.toBeVisible({ timeout: 3000 });
  });
});
