import { test, expect } from "../fixtures/base";
import { PracticePage } from "../pages/practice.page";

test.describe("Practice page", () => {
  test("loads and renders heading", async ({ page, learningApi }) => {
    await learningApi.practice();

    const practice = new PracticePage(page);
    await practice.goto();

    await expect(practice.heading).toBeVisible();
  });

  test("renders challenge table", async ({ page, learningApi }) => {
    await learningApi.practice();

    const practice = new PracticePage(page);
    await practice.goto();

    await expect(practice.challengeTable).toBeVisible();
    expect(await practice.challengeRows.count()).toBeGreaterThan(0);
  });

  test("search filters challenges", async ({ page, learningApi }) => {
    await learningApi.practice();

    const practice = new PracticePage(page);
    await practice.goto();

    const initialCount = await practice.challengeRows.count();
    await practice.searchInput.fill("zzz-nonexistent-challenge");

    // Either filtered to 0 rows or shows empty state
    const emptyState = page.getByText(/no challenge|adjust/i);
    const filteredRows = practice.challengeRows;
    const isEmpty = (await emptyState.count()) > 0;
    const rowCount = await filteredRows.count();
    expect(isEmpty || rowCount < initialCount).toBeTruthy();
  });

  test("progress bar is visible", async ({ page, learningApi }) => {
    await learningApi.practice();

    const practice = new PracticePage(page);
    await practice.goto();

    await expect(practice.progressBar).toBeVisible();
  });
});
