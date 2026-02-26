import { test, expect } from "@playwright/test";

test.describe("Dashboard page", () => {
  test("loads dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible({ timeout: 5000 });
  });

  test("shows XP or progress section", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByText(/xp|progress|enrolled|learning/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
