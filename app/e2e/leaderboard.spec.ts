import { test, expect } from "@playwright/test";

test.describe("Leaderboard — Structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.locator("h1")).toBeVisible();
    // Wait for leaderboard data to load (podium shows "1st")
    await expect(page.getByText("1st")).toBeVisible({ timeout: 30000 });
  });

  test("title renders", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toHaveText(/leaderboard/i);
  });

  test("time filter tabs visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "This Week" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "This Month" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "All Time" })).toBeVisible();
  });

  test("podium section shows 1st, 2nd, 3rd", async ({ page }) => {
    await expect(page.getByText("1st")).toBeVisible();
    await expect(page.getByText("2nd")).toBeVisible();
    await expect(page.getByText("3rd")).toBeVisible();
  });

  test("table has Rank and XP columns", async ({ page }) => {
    const rankHeader = page.getByText("RANK");
    const xpHeader = page.getByText("XP");

    await expect(rankHeader.first()).toBeVisible();
    await expect(xpHeader.first()).toBeVisible();
  });

  test("podium shows display names and XP values", async ({ page }) => {
    // Wait for podium data to load (not just heading)
    await expect(page.getByText("1st")).toBeVisible();

    // Podium names use font-semibold
    const podiumNames = page.locator(".font-semibold");
    const nameCount = await podiumNames.count();
    expect(nameCount).toBeGreaterThanOrEqual(3);

    // XP values on podium use text-xp class
    const xpValues = page.locator(".text-xp");
    const xpCount = await xpValues.count();
    expect(xpCount).toBeGreaterThanOrEqual(3);
  });

  test("streak data with 'd' suffix visible", async ({ page }) => {
    const streakValues = page.getByText(/\d+d/);
    await expect(streakValues.first()).toBeVisible();
  });

  test("current user rank section visible", async ({ page }) => {
    // The "your rank" section uses glass class
    const rankSection = page.locator(".glass").last();
    await expect(rankSection).toBeVisible();
  });
});

test.describe("Leaderboard — Filter Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.locator("h1")).toBeVisible();
    // Wait for leaderboard data to load
    await expect(page.getByText("1st")).toBeVisible({ timeout: 30000 });
  });

  test("all-time is default active", async ({ page }) => {
    const allTimeTab = page.getByRole("button", { name: "All Time" });
    await expect(allTimeTab).toHaveClass(/shadow/);
  });

  test("switching filter tabs updates active tab styling", async ({ page }) => {
    const weeklyTab = page.getByRole("button", { name: "This Week" });
    const allTimeTab = page.getByRole("button", { name: "All Time" });

    await weeklyTab.click();
    await page.waitForTimeout(500);
    await expect(weeklyTab).toHaveClass(/shadow/);
    await expect(allTimeTab).not.toHaveClass(/shadow/);
  });

  test("switching to monthly filter keeps page stable", async ({ page }) => {
    const monthlyTab = page.getByRole("button", { name: "This Month" });
    await monthlyTab.click();
    await page.waitForTimeout(500);

    await expect(page.locator("main")).toBeVisible();
    await expect(monthlyTab).toHaveClass(/shadow/);
  });
});

test.describe("Leaderboard — Table Entries", () => {
  test("table rows with rank numbers visible", async ({ page }) => {
    await page.goto("/leaderboard");
    // Wait for leaderboard data to fully load (podium renders "1st")
    await expect(page.getByText("1st")).toBeVisible({ timeout: 30000 });

    // Table should have at least one row with XP data
    const xpInTable = page.locator(".text-xp");
    await expect(xpInTable.first()).toBeVisible();
    const count = await xpInTable.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("table shows builder names", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.locator("h1")).toBeVisible();

    // BUILDER column header
    const builderHeader = page.getByText("BUILDER");
    await expect(builderHeader.first()).toBeVisible();
  });
});
