import { test, expect } from "@playwright/test";

test.describe("Leaderboard", () => {
  test("renders leaderboard page", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await expect(page.locator("h1")).toContainText(/leaderboard/i);
  });

  test("shows time filter tabs", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await expect(page.getByText(/all time/i)).toBeVisible();
  });
});
