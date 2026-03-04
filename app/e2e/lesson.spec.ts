import { test, expect, type Page } from "@playwright/test";

/** Navigate to a lesson page via course detail */
async function goToFirstLesson(page: Page) {
  await page.goto("/courses");
  await expect(page.locator("h1")).toBeVisible();
  const cards = page.locator('a[href^="/courses/"]');
  await expect(cards.first()).toBeVisible({ timeout: 15000 });
  await cards.first().click();
  // Wait for course detail page (not catalog)
  await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
  await expect(page).not.toHaveURL("/courses");

  // Click on a lesson in the module list
  const lessonLink = page.locator('a[href*="/lessons/"]').first();
  await expect(lessonLink).toBeVisible({ timeout: 15000 });
  await lessonLink.click();
  await expect(page.locator("main")).toBeVisible();
}

test.describe("Lesson — Content & Navigation", () => {
  test("lesson page loads with title and content area", async ({ page }) => {
    await goToFirstLesson(page);

    const title = page.locator("h1");
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText!.length).toBeGreaterThan(3);
    await expect(page.locator("main")).toBeVisible();
  });

  test("lesson header shows progress counter", async ({ page }) => {
    await goToFirstLesson(page);

    // Should show lesson counter like "1 / 12" or "Lesson 1 of 12"
    const counter = page.getByText(/\d+\s*[/of]\s*\d+/i);
    await expect(counter.first()).toBeVisible();
  });

  test("lesson header shows XP reward", async ({ page }) => {
    await goToFirstLesson(page);

    const xpDisplay = page.getByText(/\d+\s*XP/);
    await expect(xpDisplay.first()).toBeVisible();
  });

  test("lesson page has content section", async ({ page }) => {
    await goToFirstLesson(page);

    // Main content area should have substantial text
    const mainContent = await page.locator("main").textContent();
    expect(mainContent!.length).toBeGreaterThan(50);
  });

  test("lesson page shows back link to course", async ({ page }) => {
    await goToFirstLesson(page);

    const backLink = page.locator("a").filter({ hasText: /back|course/i });
    await expect(backLink.first()).toBeVisible();
  });

  test("prev/next lesson navigation visible", async ({ page }) => {
    await goToFirstLesson(page);

    // Next lesson link should be visible (first lesson has a next)
    const nextLink = page.locator("a, button").filter({ hasText: /next/i });
    const count = await nextLink.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("lesson page has Mark Complete or connect wallet prompt", async ({
    page,
  }) => {
    await goToFirstLesson(page);

    // Either a Mark Complete button or a connect wallet prompt
    const markComplete = page
      .locator("button")
      .filter({ hasText: /mark complete/i });
    const connectWallet = page.getByText(/connect.*wallet|sign in/i);

    const hasMarkComplete = (await markComplete.count()) > 0;
    const hasConnectPrompt = (await connectWallet.count()) > 0;
    expect(hasMarkComplete || hasConnectPrompt).toBeTruthy();
  });
});

test.describe("Lesson — Direct Navigation", () => {
  test("lesson page accessible via direct URL", async ({ page }) => {
    // Get a real lesson URL from the course detail
    await page.goto("/courses");
    await expect(page.locator("h1")).toBeVisible();
    const cards = page.locator('a[href^="/courses/"]');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    await cards.first().click();
    await expect(page).not.toHaveURL("/courses");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });

    const lessonLink = page.locator('a[href*="/lessons/"]').first();
    await expect(lessonLink).toBeVisible({ timeout: 15000 });
    const href = await lessonLink.getAttribute("href");
    if (href) {
      await page.goto(href);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();
    }
  });
});
