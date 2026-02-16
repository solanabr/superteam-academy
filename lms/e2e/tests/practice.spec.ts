import { test, expect } from "../fixtures/base";
import { PracticePage } from "../pages/practice.page";

test.describe("Practice page", () => {
  test.beforeEach(async ({ learningApi }) => {
    await learningApi.practice();
  });

  test("loads and renders heading", async ({ page }) => {
    const practice = new PracticePage(page);
    await practice.goto();
    await page.waitForLoadState("domcontentloaded");

    await expect(practice.heading).toBeVisible();
  });

  test("renders challenge table", async ({ page }) => {
    const practice = new PracticePage(page);
    await practice.goto();
    await page.waitForLoadState("domcontentloaded");

    await expect(practice.challengeTable).toBeVisible();
    expect(await practice.challengeRows.count()).toBeGreaterThan(0);
  });

  test("search filters challenges", async ({ page }) => {
    const practice = new PracticePage(page);
    await practice.goto();
    await page.waitForLoadState("domcontentloaded");

    // Wait for the table to render
    await expect(practice.challengeTable).toBeVisible();
    const initialCount = await practice.challengeRows.count();

    await practice.searchInput.fill("zzz-nonexistent-challenge");

    // Should show empty state or fewer rows
    await expect(async () => {
      const emptyVisible = await page.getByText("No challenges found").isVisible().catch(() => false);
      const currentRows = await practice.challengeRows.count();
      expect(emptyVisible || currentRows < initialCount).toBeTruthy();
    }).toPass({ timeout: 5_000 });
  });

  test("progress bar is visible", async ({ page }) => {
    const practice = new PracticePage(page);
    await practice.goto();
    await page.waitForLoadState("domcontentloaded");

    // The progress bar container: div.h-2.w-full.rounded-full.bg-muted
    const progressContainer = page.locator(".h-2.rounded-full").first();
    await expect(progressContainer).toBeVisible();
  });
});
