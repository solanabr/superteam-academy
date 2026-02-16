import { test, expect } from "../fixtures/base";
import { LeaderboardPage } from "../pages/leaderboard.page";

const MOCK_ENTRIES = [
  { wallet: "w1", displayName: "Alice", xp: 5000, level: 10, streak: 15, rank: 1 },
  { wallet: "w2", displayName: "Bob", xp: 3500, level: 8, streak: 10, rank: 2 },
  { wallet: "w3", displayName: "Charlie", xp: 2000, level: 5, streak: 5, rank: 3 },
  { wallet: "w4", displayName: "Dave", xp: 1000, level: 3, streak: 2, rank: 4 },
];

test.describe("Leaderboard page", () => {
  test("renders leaderboard with entries", async ({ page, learningApi }) => {
    await learningApi.leaderboard(MOCK_ENTRIES);
    await learningApi.xp(0);

    const lb = new LeaderboardPage(page);
    await lb.goto();

    await expect(lb.heading).toBeVisible();
    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("Bob")).toBeVisible();
  });

  test("shows empty state when no entries", async ({ page, learningApi }) => {
    await learningApi.leaderboard([]);
    await learningApi.xp(0);

    const lb = new LeaderboardPage(page);
    await lb.goto();

    await expect(lb.emptyState).toBeVisible();
  });

  test("entries are displayed in XP order", async ({ page, learningApi }) => {
    await learningApi.leaderboard(MOCK_ENTRIES);
    await learningApi.xp(0);

    const lb = new LeaderboardPage(page);
    await lb.goto();

    // Alice (5000 XP) should appear before Dave (1000 XP)
    const allText = await page.locator("body").textContent();
    const aliceIdx = allText?.indexOf("Alice") ?? -1;
    const daveIdx = allText?.indexOf("Dave") ?? -1;
    expect(aliceIdx).toBeLessThan(daveIdx);
  });

  test("timeframe tabs are visible", async ({ page, learningApi }) => {
    await learningApi.leaderboard(MOCK_ENTRIES);
    await learningApi.xp(0);

    const lb = new LeaderboardPage(page);
    await lb.goto();

    expect(await lb.timeframeTabs.count()).toBeGreaterThanOrEqual(3);
  });
});
