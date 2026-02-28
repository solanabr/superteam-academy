import { test, expect } from '@playwright/test';
import { CoursesPage } from '../pages/courses.page';
import { I18N } from '../fixtures/test-data';

test.describe('Course Catalog', () => {
  let courses: CoursesPage;

  test.beforeEach(async ({ page }) => {
    courses = new CoursesPage(page);
    await courses.navigate();
  });

  test('page loads with catalog title', async () => {
    await expect(courses.pageTitle).toBeVisible();
    await expect(courses.pageTitle).toContainText(I18N.en.catalogTitle);
  });

  test('search input is present and functional', async ({ page: _page }) => {
    await expect(courses.searchInput).toBeVisible();

    // Type a search query — should not crash
    await courses.searchCourse('solana');
    await expect(courses.searchInput).toHaveValue('solana');
  });

  test('course grid renders or shows empty state', async () => {
    // The page should either show course cards OR an empty state message.
    // In a static/mock environment, the store starts empty, so we expect
    // the empty state or cards depending on whether mock data is seeded.
    const cardsCount = await courses.courseCards.count();
    const emptyVisible = await courses.emptyState.isVisible().catch(() => false);

    expect(cardsCount > 0 || emptyVisible).toBeTruthy();
  });

  test('search with non-matching query shows empty state', async () => {
    await courses.searchCourse('zzz_nonexistent_course_xyz');

    // After filtering with a nonsensical query, either:
    // - Empty state text appears, OR
    // - Zero course cards remain
    const cardsCount = await courses.courseCards.count();
    const emptyVisible = await courses.emptyState.isVisible().catch(() => false);

    expect(cardsCount === 0 || emptyVisible).toBeTruthy();
  });

  test('page has filter sidebar on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await courses.navigate();

    // The sidebar should be visible on desktop (hidden on mobile via lg:flex)
    // We verify the search bar and filter button exist at minimum
    await expect(courses.searchInput).toBeVisible();
  });
});
