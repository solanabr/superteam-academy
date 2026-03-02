import { test, expect } from "@playwright/test";
import { gotoWithLocale } from "./fixtures/test-helpers";

test.describe("Admin Dashboard", () => {
  test("admin page renders with password gate when not authenticated", async ({
    page,
  }) => {
    await gotoWithLocale(page, "/admin");
    // AdminGuard shows password prompt when not authenticated
    await expect(page.getByText(/Admin Access/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Enter the admin password/i)).toBeVisible();
  });

  test("password input is visible and submittable", async ({ page }) => {
    await gotoWithLocale(page, "/admin");
    await expect(page.getByText(/Admin Access/i)).toBeVisible({
      timeout: 15_000,
    });

    // Password input should be present
    const passwordInput = page.locator("input[type='password']");
    await expect(passwordInput).toBeVisible({ timeout: 10_000 });
  });

  test("wrong password shows error", async ({ page }) => {
    await gotoWithLocale(page, "/admin");
    await expect(page.getByText(/Admin Access/i)).toBeVisible({
      timeout: 15_000,
    });

    const passwordInput = page.locator("input[type='password']");
    await passwordInput.fill("wrong-password");
    await passwordInput.press("Enter");

    // Should show error or remain on the gate
    await page.waitForTimeout(1000);
    const body = await page.locator("body").textContent();
    // Should still show admin access gate (not dashboard content)
    expect(
      body!.includes("Admin Access") ||
        body!.includes("Invalid") ||
        body!.includes("incorrect") ||
        body!.includes("password"),
    ).toBeTruthy();
  });
});
