import { test, expect } from "@playwright/test";

test.describe("Leaderboard — Layout & Structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");
  });

  test("leaderboard page displays title", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
  });

  test("leaderboard displays time filter tabs", async ({ page }) => {
    // Should have weekly, monthly, and all-time filter tabs
    const weeklyTab = page.locator("button").filter({ hasText: /weekly/i });
    const monthlyTab = page.locator("button").filter({ hasText: /monthly/i });
    const allTimeTab = page.locator("button").filter({ hasText: /all.?time/i });

    await expect(weeklyTab).toBeVisible();
    await expect(monthlyTab).toBeVisible();
    await expect(allTimeTab).toBeVisible();
  });

  test("leaderboard displays podium section with top 3", async ({ page }) => {
    // Podium should show rank labels (1st, 2nd, 3rd)
    const firstPlace = page.getByText("1st");
    const secondPlace = page.getByText("2nd");
    const thirdPlace = page.getByText("3rd");

    await expect(firstPlace).toBeVisible({ timeout: 5000 });
    await expect(secondPlace).toBeVisible({ timeout: 5000 });
    await expect(thirdPlace).toBeVisible({ timeout: 5000 });
  });

  test("leaderboard table displays XP and level columns", async ({ page }) => {
    // Table headers should include rank, XP, level
    const rankHeader = page.getByText(/^rank$/i);
    const xpHeader = page.getByText(/^xp$/i);

    await expect(rankHeader.first()).toBeVisible({ timeout: 5000 });
    await expect(xpHeader.first()).toBeVisible({ timeout: 5000 });
  });

  test("leaderboard shows streak data with flame icon", async ({ page }) => {
    // Streak values should be visible (e.g., "5d", "12d")
    const streakValues = page.locator("text=/\\d+d/");
    await expect(streakValues.first()).toBeVisible({ timeout: 5000 });
  });

  test("leaderboard shows current user summary at bottom", async ({ page }) => {
    // Should show "Your Rank" or similar user summary section
    const yourRank = page.getByText(/your rank|your position/i);
    await expect(yourRank.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Leaderboard — Time Filter Switching", () => {
  test("switching to weekly filter reloads data", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");

    // Click weekly tab
    const weeklyTab = page.locator("button").filter({ hasText: /weekly/i });
    await weeklyTab.click();

    // Podium should still be visible after filter change
    const firstPlace = page.getByText("1st");
    await expect(firstPlace).toBeVisible({ timeout: 5000 });
  });

  test("switching to monthly filter reloads data", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");

    // Click monthly tab
    const monthlyTab = page.locator("button").filter({ hasText: /monthly/i });
    await monthlyTab.click();

    // Podium should still be visible after filter change
    const firstPlace = page.getByText("1st");
    await expect(firstPlace).toBeVisible({ timeout: 5000 });
  });

  test("all-time filter is active by default", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");

    // The all-time tab should have the active styling (bg-card class)
    const allTimeTab = page.locator("button").filter({ hasText: /all.?time/i });
    await expect(allTimeTab).toBeVisible();

    // Verify it has the active styling (shadow-sm is added to active tab)
    await expect(allTimeTab).toHaveClass(/shadow/);
  });

  test("clicking different filters changes the active tab", async ({
    page,
  }) => {
    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");

    // Click weekly
    const weeklyTab = page.locator("button").filter({ hasText: /weekly/i });
    await weeklyTab.click();

    // Weekly should now have the active style
    await expect(weeklyTab).toHaveClass(/shadow/);

    // All-time should lose the active style
    const allTimeTab = page.locator("button").filter({ hasText: /all.?time/i });
    await expect(allTimeTab).not.toHaveClass(/shadow/);
  });
});

test.describe("Leaderboard — Leaderboard Entries", () => {
  test("leaderboard shows multiple entries in the table", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");

    // The table should have multiple rows with rank badges
    // Ranks appear as #4, #5, etc. (top 3 use special icons)
    const rankEntries = page.locator("text=/^#\\d+$/");
    const count = await rankEntries.count();
    // Mock data typically has 10+ entries, top 3 have icons so at least 7 have #N text
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("leaderboard entries show display names", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");

    // Podium entries should show display names
    const podiumNames = page.locator("p.font-semibold");
    const count = await podiumNames.count();
    expect(count).toBeGreaterThanOrEqual(3); // At least the 3 podium names
  });

  test("leaderboard entries show XP values", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");

    // XP values should be displayed (formatted numbers)
    const xpValues = page.locator(".text-xp");
    const count = await xpValues.count();
    expect(count).toBeGreaterThanOrEqual(3); // At least podium XP values
  });

  test("user rank section shows learner count", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.waitForLoadState("networkidle");

    // Should show "X learners" text in the user summary
    const learnersText = page.getByText(/learners/i);
    await expect(learnersText.first()).toBeVisible({ timeout: 5000 });
  });
});
