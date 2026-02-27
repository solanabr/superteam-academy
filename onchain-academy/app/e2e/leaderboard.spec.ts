import { test, expect } from "@playwright/test";
import { gotoWithLocale } from "./fixtures/test-helpers";

test.describe("Leaderboard Page", () => {
  test("leaderboard page renders with heading", async ({ page }) => {
    await gotoWithLocale(page, "/leaderboard");
    await expect(
      page.getByRole("heading", { name: /leaderboard/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("leaderboard shows builder entries with names and XP", async ({
    page,
  }) => {
    await gotoWithLocale(page, "/leaderboard");
    await expect(
      page.getByRole("heading", { name: /leaderboard/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Wait for demo data to load (loading state to disappear)
    await expect(page.getByText("LOADING...")).toBeHidden({ timeout: 15_000 });

    // Demo entries should be visible
    await expect(page.getByText("SolDev.eth").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("AnchorMaster").first()).toBeVisible();
    // XP values should be shown
    await expect(page.getByText(/XP/).first()).toBeVisible();
  });

  test("timeframe tabs are visible and switchable", async ({ page }) => {
    await gotoWithLocale(page, "/leaderboard");
    await expect(
      page.getByRole("heading", { name: /leaderboard/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Time filter buttons should be present
    await expect(page.getByText("THIS WEEK")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("THIS MONTH")).toBeVisible();
    await expect(page.getByText("ALL TIME")).toBeVisible();

    // Click "THIS WEEK" and verify the leader list changes
    await page.getByText("THIS WEEK").click();
    // Wait for data to reload
    await expect(page.getByText("LOADING...")).toBeHidden({ timeout: 10_000 });
    // Weekly top entry is RustyCoder based on the demo data
    await expect(page.getByText("RustyCoder").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("demo notice is shown when using demo data", async ({ page }) => {
    await gotoWithLocale(page, "/leaderboard");
    await expect(
      page.getByRole("heading", { name: /leaderboard/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Wait for loading to finish
    await expect(page.getByText("LOADING...")).toBeHidden({ timeout: 15_000 });

    // Demo banner should appear
    await expect(page.getByText(/DEMO DATA/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("your position section is visible at the bottom", async ({ page }) => {
    await gotoWithLocale(page, "/leaderboard");
    await expect(
      page.getByRole("heading", { name: /leaderboard/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Wait for loading to finish
    await expect(page.getByText("LOADING...")).toBeHidden({ timeout: 15_000 });

    // "YOUR POSITION" section
    await expect(page.getByText("YOUR POSITION")).toBeVisible({
      timeout: 10_000,
    });
    // Should show a CTA to continue learning
    await expect(
      page.getByText(/Continue Learning/i).first(),
    ).toBeVisible();
  });
});
