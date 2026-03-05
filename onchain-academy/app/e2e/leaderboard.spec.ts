import { test, expect } from "@playwright/test";

test.describe("Leaderboard Page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase user_profiles query
    await page.route("**/rest/v1/user_profiles**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            wallet: "ABC123def456ghi789jkl012mno345pqr678stu901vwx",
            display_name: "SolanaBuilder",
            xp: 12500,
            level: 8,
            streak: 42,
            show_in_leaderboard: true,
          },
          {
            wallet: "DEF456ghi789jkl012mno345pqr678stu901vwxABC123",
            display_name: "RustDev",
            xp: 9800,
            level: 6,
            streak: 21,
            show_in_leaderboard: true,
          },
          {
            wallet: "GHI789jkl012mno345pqr678stu901vwxABC123DEF456",
            display_name: "AnchorFan",
            xp: 7200,
            level: 5,
            streak: 15,
            show_in_leaderboard: true,
          },
        ]),
      });
    });

    await page.goto("/en/leaderboard");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Leaderboard" })
    ).toBeVisible();
  });

  test("renders filter buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: "XP" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Streak" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Level" })).toBeVisible();
  });

  test("renders leaderboard entries", async ({ page }) => {
    await expect(page.getByText("SolanaBuilder")).toBeVisible();
    await expect(page.getByText("RustDev")).toBeVisible();
    await expect(page.getByText("AnchorFan")).toBeVisible();
  });

  test("shows medal emojis for top 3", async ({ page }) => {
    await expect(page.getByText("🥇")).toBeVisible();
    await expect(page.getByText("🥈")).toBeVisible();
    await expect(page.getByText("🥉")).toBeVisible();
  });
});

test.describe("Leaderboard — Empty State", () => {
  test("shows empty message when no users", async ({ page }) => {
    await page.route("**/rest/v1/user_profiles**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/en/leaderboard");
    await expect(
      page.getByText("No users on the leaderboard yet")
    ).toBeVisible();
  });
});
