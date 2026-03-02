import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("shows connect prompt when no wallet", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page.getByText(/connect/i)).toBeVisible();
  });
});
