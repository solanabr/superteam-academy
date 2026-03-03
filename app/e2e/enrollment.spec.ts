import { test, expect, type Page } from "@playwright/test";

/**
 * Clear all app-related localStorage entries to ensure a fresh state.
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

test.describe("Enrollment Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean state
    await page.goto("/courses/intro-to-solana");
    await clearAppStorage(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("course detail page shows enrollment button when not enrolled", async ({
    page,
  }) => {
    // Should display the enroll button
    const enrollButton = page.locator("button").filter({ hasText: /enroll/i });
    await expect(enrollButton).toBeVisible();

    // Should NOT show a progress bar or continue button
    const continueButton = page.locator("a").filter({ hasText: /continue/i });
    await expect(continueButton).not.toBeVisible();
  });

  test("clicking enroll button enrolls user and shows continue button", async ({
    page,
  }) => {
    // Click the enroll button
    const enrollButton = page.locator("button").filter({ hasText: /enroll/i });
    await expect(enrollButton).toBeVisible();
    await enrollButton.click();

    // After enrollment, the enroll button should be replaced by a continue/lesson link
    const continueLink = page
      .locator("a")
      .filter({ hasText: /continue|start/i });
    await expect(continueLink).toBeVisible({ timeout: 5000 });

    // Progress bar should appear at 0%
    const progressText = page.getByText("0%");
    await expect(progressText).toBeVisible();
  });

  test("enrolled course appears on dashboard", async ({ page }) => {
    // Enroll in the course
    const enrollButton = page.locator("button").filter({ hasText: /enroll/i });
    await enrollButton.click();

    // Wait for enrollment to take effect
    const continueLink = page
      .locator("a")
      .filter({ hasText: /continue|start/i });
    await expect(continueLink).toBeVisible({ timeout: 5000 });

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // The enrolled course should appear on the dashboard
    const courseTitle = page.getByText("Introduction to Solana");
    await expect(courseTitle.first()).toBeVisible({ timeout: 5000 });
  });

  test("continue learning button navigates to first lesson", async ({
    page,
  }) => {
    // Enroll in the course
    const enrollButton = page.locator("button").filter({ hasText: /enroll/i });
    await enrollButton.click();

    // Click continue learning
    const continueLink = page
      .locator("a")
      .filter({ hasText: /continue|start/i });
    await expect(continueLink).toBeVisible({ timeout: 5000 });
    await continueLink.click();

    // Should navigate to the first lesson page
    await expect(page).toHaveURL(/\/courses\/intro-to-solana\/lessons\//);
    await expect(page.locator("main")).toBeVisible();
  });

  test("enrollment persists after page reload", async ({ page }) => {
    // Enroll in the course
    const enrollButton = page.locator("button").filter({ hasText: /enroll/i });
    await enrollButton.click();

    // Wait for enrollment to take effect
    const continueLink = page
      .locator("a")
      .filter({ hasText: /continue|start/i });
    await expect(continueLink).toBeVisible({ timeout: 5000 });

    // Reload the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should still show continue button (not enroll)
    const continueLinkAfterReload = page
      .locator("a")
      .filter({ hasText: /continue|start|completed/i });
    await expect(continueLinkAfterReload).toBeVisible({ timeout: 5000 });
  });

  test("course detail page shows module list with lessons", async ({
    page,
  }) => {
    // Should show module sections
    const moduleHeading = page.getByText("Getting Started");
    await expect(moduleHeading.first()).toBeVisible();

    // Should show lesson titles
    const lessonTitle = page.getByText("What is Solana?");
    await expect(lessonTitle.first()).toBeVisible();
  });

  test("course detail page displays course metadata", async ({ page }) => {
    // Should show the course title
    await expect(page.locator("h1")).toContainText("Introduction to Solana");

    // Should show difficulty badge
    const difficultyBadge = page.getByText("beginner", { exact: false });
    await expect(difficultyBadge.first()).toBeVisible();

    // Should show XP total
    const xpDisplay = page.getByText("600 XP");
    await expect(xpDisplay.first()).toBeVisible();
  });
});
