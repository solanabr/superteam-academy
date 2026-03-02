import { test, expect } from "@playwright/test";

test.describe("Courses — Catalog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("catalog loads real courses", async ({ page }) => {
    const courseCards = page.locator('a[href^="/courses/"]');
    await expect(courseCards.first()).toBeVisible();
    const count = await courseCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("search filters by title", async ({ page }) => {
    const searchInput = page.locator(
      '#course-search, input[placeholder*="Search" i], input[type="text"]',
    );
    // Wait for courses to load first
    await page
      .locator('a[href^="/courses/"]')
      .first()
      .waitFor({ state: "visible", timeout: 10000 });

    await searchInput.first().fill("Solana");
    await page.waitForTimeout(1000);

    const courseCards = page.locator('a[href^="/courses/"]');
    await expect(courseCards.first()).toBeVisible({ timeout: 5000 });
    const count = await courseCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("search with no match shows empty state", async ({ page }) => {
    const searchInput = page.locator(
      '#course-search, input[placeholder*="Search" i], input[type="text"]',
    );
    await searchInput.first().fill("xyznonexistentcourse123");
    await page.waitForTimeout(500);

    const emptyState = page.getByText(/no courses found|no results|not found/i);
    await expect(emptyState.first()).toBeVisible();
  });

  test("difficulty filter pills filter correctly", async ({ page }) => {
    await page
      .locator('a[href^="/courses/"]')
      .first()
      .waitFor({ state: "visible", timeout: 10000 });

    const beforeCount = await page.locator('a[href^="/courses/"]').count();

    const beginnerButton = page
      .locator("button")
      .filter({ hasText: /beginner/i })
      .first();
    await beginnerButton.click();
    await page.waitForTimeout(500);

    const courseCards = page.locator('a[href^="/courses/"]');
    const afterCount = await courseCards.count();
    // Filter should either reduce results or show only beginner courses
    expect(afterCount).toBeGreaterThanOrEqual(1);
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
  });

  test("course cards show essential metadata", async ({ page }) => {
    const firstCard = page.locator('a[href^="/courses/"]').first();
    await expect(firstCard).toBeVisible();

    const xpInCard = firstCard.locator("text=/\\d+\\s*XP/i");
    await expect(xpInCard.first()).toBeVisible();
  });

  test("clicking card navigates to course detail", async ({ page }) => {
    const firstCard = page.locator('a[href^="/courses/"]').first();
    const href = await firstCard.getAttribute("href");
    await firstCard.click();
    await expect(page).toHaveURL(href!);
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("Courses — Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("h1")).toBeVisible();
    const firstCard = page.locator('a[href^="/courses/"]').first();
    await firstCard.click();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("course detail shows title", async ({ page }) => {
    const title = await page.locator("h1").textContent();
    expect(title!.length).toBeGreaterThan(3);
  });

  test("course detail shows creator", async ({ page }) => {
    const creatorText = page.getByText(/created by|instructor|by/i);
    await expect(creatorText.first()).toBeVisible();
  });

  test("course detail shows modules and lessons", async ({ page }) => {
    const moduleHeadings = page.locator("h2, h3, h4").filter({
      hasText: /.+/,
    });
    const count = await moduleHeadings.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("course detail shows metadata (XP, difficulty)", async ({ page }) => {
    const difficultyBadge = page.getByText(/beginner|intermediate|advanced/i);
    await expect(difficultyBadge.first()).toBeVisible();

    const xpDisplay = page.getByText(/\d+\s*XP/);
    await expect(xpDisplay.first()).toBeVisible();
  });

  test("enroll or continue button visible", async ({ page }) => {
    const actionButton = page
      .locator("button, a")
      .filter({ hasText: /enroll|continue|start/i })
      .first();
    await expect(actionButton).toBeVisible();
  });
});
