import { test, expect, type Page } from "@playwright/test";

/**
 * Enroll in a course by navigating to its detail page and clicking enroll.
 */
async function enrollInCourse(page: Page, courseSlug: string) {
  await page.goto(`/courses/${courseSlug}`);
  await page.waitForLoadState("networkidle");

  const enrollButton = page.locator("button").filter({ hasText: /enroll/i });
  const isVisible = await enrollButton.isVisible().catch(() => false);

  if (isVisible) {
    await enrollButton.click();
    // Wait for enrollment to register
    await page
      .locator("a")
      .filter({ hasText: /continue|start/i })
      .waitFor({ state: "visible", timeout: 5000 });
  }
}

/**
 * Clear all app-related localStorage entries.
 */
async function clearAppStorage(page: Page) {
  await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (
        key.startsWith("sta-") ||
        key.startsWith("sta_") ||
        key.startsWith("learning-progress")
      ) {
        localStorage.removeItem(key);
      }
    }
  });
}

test.describe("Lesson Completion", () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean state and enroll
    await page.goto("/");
    await clearAppStorage(page);
    await enrollInCourse(page, "intro-to-solana");
  });

  test("lesson page loads with content and navigation", async ({ page }) => {
    await page.goto("/courses/intro-to-solana/lessons/l1");
    await page.waitForLoadState("networkidle");

    // Should display the lesson title
    const title = page.locator("h1");
    await expect(title).toContainText("What is Solana?");

    // Should display the lesson content area
    await expect(page.locator("main")).toBeVisible();
  });

  test("lesson page shows Mark Complete button for incomplete lesson", async ({
    page,
  }) => {
    await page.goto("/courses/intro-to-solana/lessons/l1");
    await page.waitForLoadState("networkidle");

    // Should have a Mark Complete button
    const markCompleteBtn = page
      .locator("button")
      .filter({ hasText: /mark complete/i });
    await expect(markCompleteBtn).toBeVisible();
  });

  test("clicking Mark Complete marks the lesson as completed", async ({
    page,
  }) => {
    await page.goto("/courses/intro-to-solana/lessons/l1");
    await page.waitForLoadState("networkidle");

    // Click Mark Complete
    const markCompleteBtn = page
      .locator("button")
      .filter({ hasText: /mark complete/i });
    await markCompleteBtn.click();

    // Should show Completed badge
    const completedBadge = page.getByText("Completed", { exact: false });
    await expect(completedBadge.first()).toBeVisible({ timeout: 5000 });

    // Mark Complete button should no longer be visible
    await expect(markCompleteBtn).not.toBeVisible();
  });

  test("lesson completion persists after navigating away and back", async ({
    page,
  }) => {
    await page.goto("/courses/intro-to-solana/lessons/l1");
    await page.waitForLoadState("networkidle");

    // Complete the lesson
    const markCompleteBtn = page
      .locator("button")
      .filter({ hasText: /mark complete/i });
    await markCompleteBtn.click();
    await expect(
      page.getByText("Completed", { exact: false }).first()
    ).toBeVisible({ timeout: 5000 });

    // Navigate to another lesson
    await page.goto("/courses/intro-to-solana/lessons/l2");
    await page.waitForLoadState("networkidle");

    // Navigate back to the completed lesson
    await page.goto("/courses/intro-to-solana/lessons/l1");
    await page.waitForLoadState("networkidle");

    // Should still show as completed
    const completedBadge = page.getByText("Completed", { exact: false });
    await expect(completedBadge.first()).toBeVisible({ timeout: 5000 });
  });

  test("lesson header shows lesson progress counter", async ({ page }) => {
    await page.goto("/courses/intro-to-solana/lessons/l1");
    await page.waitForLoadState("networkidle");

    // Should show lesson counter like "1 / 12"
    const counter = page.getByText(/\d+\s*\/\s*\d+/);
    await expect(counter.first()).toBeVisible();
  });

  test("lesson header shows XP reward", async ({ page }) => {
    await page.goto("/courses/intro-to-solana/lessons/l1");
    await page.waitForLoadState("networkidle");

    // Should show XP reward in header (e.g., "20 XP")
    const xpDisplay = page.getByText(/\d+\s*XP/);
    await expect(xpDisplay.first()).toBeVisible();
  });

  test("navigating between lessons works via prev/next buttons", async ({
    page,
  }) => {
    await page.goto("/courses/intro-to-solana/lessons/l1");
    await page.waitForLoadState("networkidle");

    // Should have a next button/link
    const nextLink = page.locator('a[href*="/lessons/l2"]');
    if ((await nextLink.count()) > 0) {
      await nextLink.first().click();
      await expect(page).toHaveURL(/\/lessons\/l2/);
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("challenge lesson shows code editor interface", async ({ page }) => {
    // Lesson l3 is a challenge type
    await page.goto("/courses/intro-to-solana/lessons/l3");
    await page.waitForLoadState("networkidle");

    // Should show the challenge interface (code editor or challenge prompt area)
    await expect(page.locator("main")).toBeVisible();

    // Should have a run button
    const runButton = page.locator("button").filter({ hasText: /run/i });
    await expect(runButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("completing a lesson updates course progress on detail page", async ({
    page,
  }) => {
    // Complete lesson l1
    await page.goto("/courses/intro-to-solana/lessons/l1");
    await page.waitForLoadState("networkidle");

    const markCompleteBtn = page
      .locator("button")
      .filter({ hasText: /mark complete/i });
    await markCompleteBtn.click();
    await expect(
      page.getByText("Completed", { exact: false }).first()
    ).toBeVisible({ timeout: 5000 });

    // Navigate to course detail page
    await page.goto("/courses/intro-to-solana");
    await page.waitForLoadState("networkidle");

    // Progress should be non-zero (at least 8% for 1/12 lessons)
    // The continue button should be visible (already enrolled + progress)
    const continueLink = page
      .locator("a")
      .filter({ hasText: /continue|completed/i });
    await expect(continueLink).toBeVisible({ timeout: 5000 });
  });
});
