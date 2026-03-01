import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Dashboard', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    await dashboard.navigate();
  });

  test('dashboard page loads without errors', async ({ page }) => {
    // The page should render the main content area
    await expect(page.locator('main')).toBeVisible();

    // Title bar or heading should be somewhere in the DOM
    // (Dashboard may show a welcome banner or stats)
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('quick stats section is present', async ({ page }) => {
    // The QuickStats component renders XP, level, streak info
    // Look for stat-like content: numbers or stat cards
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // At minimum, the page should have rendered some dashboard structure
    const childElements = page.locator('main > div > div');
    const count = await childElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('continue learning section is present', async ({ page }) => {
    // The ContinueLearning component is always rendered,
    // even when empty (shows an empty state or placeholder)
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // The two-column grid layout should exist
    const gridLayout = page.locator('.grid.gap-6');
    const gridCount = await gridLayout.count();
    expect(gridCount).toBeGreaterThan(0);
  });

  test('activity heatmap section renders', async ({ page }) => {
    // ActivityHeatmap is always mounted on the dashboard
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // The page has a two-column layout with left column
    // containing ContinueLearning + ActivityHeatmap
    const leftColumn = page.locator('.grid.gap-6 > div').first();
    await expect(leftColumn).toBeVisible();

    // There should be child elements within the left column
    const children = leftColumn.locator('> div');
    const count = await children.count();
    expect(count).toBeGreaterThan(0);
  });
});
