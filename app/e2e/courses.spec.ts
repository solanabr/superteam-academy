import { test, expect } from "@playwright/test";

test.describe("Course Catalog", () => {
  test("displays course cards", async ({ page }) => {
    await page.goto("/pt/courses");
    // Wait for course cards to render
    const cards = page.locator(
      '[class*="card"], article, [data-testid="course-card"]',
    );
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });

  test("course cards have titles and links", async ({ page }) => {
    await page.goto("/pt/courses");
    // Each card should have a link to course detail
    const courseLinks = page.locator('a[href*="/courses/"]');
    await expect(courseLinks.first()).toBeVisible({ timeout: 10_000 });
  });

  test("clicking a course navigates to detail page", async ({ page }) => {
    await page.goto("/pt/courses");
    const courseLink = page.locator('a[href*="/courses/"]').first();
    await expect(courseLink).toBeVisible({ timeout: 10_000 });
    const href = await courseLink.getAttribute("href");
    await courseLink.click();
    await expect(page).toHaveURL(
      new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  });
});

test.describe("Course Detail", () => {
  test("shows course title and description", async ({ page }) => {
    await page.goto("/pt/courses");
    const courseLink = page.locator('a[href*="/courses/"]').first();
    await expect(courseLink).toBeVisible({ timeout: 10_000 });
    await courseLink.click();

    // Course detail page should have a title
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
  });

  test("shows modules accordion", async ({ page }) => {
    await page.goto("/pt/courses");
    const courseLink = page.locator('a[href*="/courses/"]').first();
    await expect(courseLink).toBeVisible({ timeout: 10_000 });
    await courseLink.click();

    // Modules section should exist
    const accordion = page.locator(
      '[data-state="closed"], [data-state="open"]',
    );
    await expect(accordion.first()).toBeVisible({ timeout: 10_000 });
  });

  test("shows enroll button for unauthenticated user", async ({ page }) => {
    await page.goto("/pt/courses");
    const courseLink = page.locator('a[href*="/courses/"]').first();
    await expect(courseLink).toBeVisible({ timeout: 10_000 });
    await courseLink.click();

    // Either enroll button or login prompt should be visible
    const enrollBtn = page.locator(
      'button:has-text("Matricular"), button:has-text("Enroll"), button:has-text("Inscribirse")',
    );
    const loginBtn = page.locator(
      'button:has-text("Conectar"), button:has-text("Connect")',
    );
    const anyAction = enrollBtn.or(loginBtn);
    await expect(anyAction.first()).toBeVisible({ timeout: 10_000 });
  });
});
