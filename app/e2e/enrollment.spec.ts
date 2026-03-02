import { test, expect, type Page } from "@playwright/test";

/** Navigate to a course detail page via catalog click */
async function goToCourseDetail(page: Page) {
  await page.goto("/courses");
  await expect(page.locator("h1")).toBeVisible();
  const cards = page.locator('a[href^="/courses/"]');
  await expect(cards.first()).toBeVisible({ timeout: 10000 });
  await cards.first().click();
  await expect(page.locator("h1")).toBeVisible();
}

test.describe("Enrollment Flow", () => {
  test("course detail page loads with title and metadata", async ({ page }) => {
    await goToCourseDetail(page);

    await expect(page.locator("h1")).toBeVisible();
    const title = await page.locator("h1").textContent();
    expect(title!.length).toBeGreaterThan(3);

    const difficultyBadge = page.getByText(/beginner|intermediate|advanced/i);
    await expect(difficultyBadge.first()).toBeVisible();

    const xpDisplay = page.getByText(/\d+\s*XP/);
    await expect(xpDisplay.first()).toBeVisible();
  });

  test("unauthenticated user sees Connect Wallet prompt", async ({ page }) => {
    await goToCourseDetail(page);

    const connectPrompt = page.getByText(/connect wallet to enroll/i);
    await expect(connectPrompt).toBeVisible();
  });

  test("course detail shows lesson count and duration", async ({ page }) => {
    await goToCourseDetail(page);

    const lessonCount = page.getByText(/lesson/i);
    await expect(lessonCount.first()).toBeVisible();

    const duration = page.getByText(/hour/i);
    await expect(duration.first()).toBeVisible();
  });

  test("course detail shows module list", async ({ page }) => {
    await goToCourseDetail(page);

    // Look for "Course Content" tab or lesson count text
    const courseContent = page.getByText(/course content|lessons across/i);
    await expect(courseContent.first()).toBeVisible();
  });

  test("course detail shows creator", async ({ page }) => {
    await goToCourseDetail(page);

    const creator = page.getByText(/superteam/i);
    await expect(creator.first()).toBeVisible();
  });

  test("course content and reviews tabs visible", async ({ page }) => {
    await goToCourseDetail(page);

    const contentTab = page
      .locator("button, [role='tab']")
      .filter({ hasText: /course content/i });
    await expect(contentTab.first()).toBeVisible();

    const reviewsTab = page
      .locator("button, [role='tab']")
      .filter({ hasText: /review/i });
    await expect(reviewsTab.first()).toBeVisible();
  });

  test("clicking lesson row navigates to lesson page", async ({ page }) => {
    await goToCourseDetail(page);

    // Click on a lesson link in the module list
    const lessonLink = page.locator('a[href*="/lessons/"]').first();
    const count = await lessonLink.count();
    if (count > 0) {
      await lessonLink.click();
      await expect(page).toHaveURL(/\/lessons\//);
      await expect(page.locator("main")).toBeVisible();
    }
  });
});
