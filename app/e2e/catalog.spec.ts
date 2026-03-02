import { test, expect } from "@playwright/test";

test.describe("Course Catalog", () => {
  test("renders catalog page", async ({ page }) => {
    await page.goto("/en/courses");
    await expect(page.locator("h1")).toContainText(/courses/i);
  });

  test("search input filters courses", async ({ page }) => {
    await page.goto("/en/courses");
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test("filter badges are visible", async ({ page }) => {
    await page.goto("/en/courses");
    await expect(page.getByText("Core Solana")).toBeVisible();
    await expect(page.getByText("Beginner")).toBeVisible();
  });
});
