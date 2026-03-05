import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("header navigation links work", async ({ page }) => {
    await page.goto("/pt");

    // Check main nav links exist
    const nav = page.locator("header, nav");
    await expect(nav.first()).toBeVisible();

    // Courses link
    const coursesLink = page
      .getByRole("link", { name: /cursos|courses/i })
      .first();
    if (await coursesLink.isVisible()) {
      await coursesLink.click();
      await expect(page).toHaveURL(/\/courses/);
    }
  });

  test("can navigate from homepage to courses to course detail", async ({
    page,
  }) => {
    // Start at homepage
    await page.goto("/pt");

    // Navigate to courses
    const coursesLink = page
      .getByRole("link", { name: /cursos|courses/i })
      .first();
    await expect(coursesLink).toBeVisible();
    await coursesLink.click();
    await expect(page).toHaveURL(/\/courses/);

    // Click first course
    const courseCard = page.locator('a[href*="/courses/"]').first();
    await expect(courseCard).toBeVisible({ timeout: 10_000 });
    await courseCard.click();
    await expect(page).toHaveURL(/\/courses\/.+/);

    // Verify course detail loaded
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("challenges page loads", async ({ page }) => {
    const response = await page.goto("/pt/challenges");
    expect(response?.status()).toBeLessThan(400);
  });

  test("leaderboard page loads", async ({ page }) => {
    const response = await page.goto("/pt/leaderboard");
    expect(response?.status()).toBeLessThan(400);
  });

  test("404 page shows for invalid routes", async ({ page }) => {
    const response = await page.goto("/pt/nonexistent-page-abc123");
    expect(response?.status()).toBe(404);
  });
});
