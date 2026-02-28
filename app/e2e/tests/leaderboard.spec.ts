import { test, expect } from '@playwright/test';
import { LeaderboardPage } from '../pages/leaderboard.page';
import { I18N } from '../fixtures/test-data';

test.describe('Leaderboard', () => {
  let leaderboard: LeaderboardPage;

  test.beforeEach(async ({ page }) => {
    leaderboard = new LeaderboardPage(page);
    await leaderboard.navigate();
  });

  test('leaderboard page loads with title', async () => {
    await expect(leaderboard.pageTitle).toBeVisible();
    await expect(leaderboard.pageTitle).toContainText(I18N.en.leaderboardTitle);
  });

  test('time filter buttons are rendered', async ({ page }) => {
    // The TimeFilter component renders tab elements for Weekly, Monthly, All Time
    const weeklyBtn = page.getByRole('tab', { name: /weekly/i });
    const monthlyBtn = page.getByRole('tab', { name: /monthly/i });
    const allTimeBtn = page.getByRole('tab', { name: /all time/i });

    await expect(weeklyBtn).toBeVisible();
    await expect(monthlyBtn).toBeVisible();
    await expect(allTimeBtn).toBeVisible();
  });

  test('refresh button is present and clickable', async () => {
    await expect(leaderboard.refreshButton).toBeVisible();

    // Click refresh — should not crash
    await leaderboard.refreshButton.click();

    // Page should still be intact after refresh
    await expect(leaderboard.pageTitle).toBeVisible();
  });
});
