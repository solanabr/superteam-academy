import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/superteam|academy/i)).toBeVisible();
  });

  test("navbar links work", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /courses/i }).click();
    await expect(page).toHaveURL(/\/courses/);
    await page.goto("/");
    await page.getByRole("link", { name: /leaderboard/i }).click();
    await expect(page).toHaveURL(/\/leaderboard/);
    await page.goto("/");
    await page.getByRole("link", { name: /community/i }).click();
    await expect(page).toHaveURL(/\/community/);
    await page.goto("/");
    await page.getByRole("link", { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
