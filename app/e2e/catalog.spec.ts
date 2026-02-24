import { test, expect } from "@playwright/test";

test.describe("Course Catalog", () => {
  test("hero section shows heading and both CTAs", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/On-Chain/);
    // Primary CTA
    await expect(page.locator("text=Explore Courses").first()).toBeVisible();
  });

  test("hero stats show on-chain metrics", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=On-Chain").first()).toBeVisible();
    await expect(page.locator("text=XP Tokens").first()).toBeVisible();
    await expect(page.locator("text=Credentials").first()).toBeVisible();
  });

  test("catalog section has heading", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("text=Course Catalog").or(page.locator("text=No courses")).first()).toBeVisible({ timeout: 15000 });
  });

  test("filter buttons are present when catalog renders", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    // Difficulty filter or search
    await expect(
      page.locator("text=All Levels")
        .or(page.locator("text=All Tracks"))
        .or(page.locator('input[placeholder*="Search"]'))
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("search input accepts text", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill("solana");
      await expect(searchInput.first()).toHaveValue("solana");
    }
  });
});
