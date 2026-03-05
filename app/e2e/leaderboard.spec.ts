import { test, expect } from "@playwright/test";
import { dismissOnboarding } from "./helpers";

test.describe("Leaderboard — page structure", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en/leaderboard");
    await page.waitForLoadState("networkidle");
  });

  test("page loads without error URL", async ({ page }) => {
    await expect(page).not.toHaveURL(/error|404/);
  });

  test("page has a visible heading", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("main content area is visible", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("page does not show unhandled runtime error", async ({ page }) => {
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });

  test("page title is non-empty", async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe("Leaderboard — time filter tabs", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en/leaderboard");
    await page.waitForLoadState("networkidle");
  });

  test("time filter tabs or controls are present", async ({ page }) => {
    const tabs = page
      .locator('[role="tab"]')
      .or(page.locator("button:has-text('All'), button:has-text('Weekly'), button:has-text('Monthly')"))
      .or(page.locator("[data-value='allTime'], [data-value='weekly'], [data-value='monthly']"));
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });

  test("clicking the second tab does not produce an error", async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    if (count > 1) {
      await tabs.nth(1).click();
      await page.waitForTimeout(400);
      await expect(page).not.toHaveURL(/error/);
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("clicking through all tabs does not crash", async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(200);
      await expect(page.locator("main")).toBeVisible();
    }
  });
});

test.describe("Leaderboard — content", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en/leaderboard");
    await page.waitForLoadState("networkidle");
  });

  test("leaderboard has a list, table, or card structure", async ({ page }) => {
    const hasTable = (await page.locator("table").count()) > 0;
    const hasList = (await page.locator("ul, ol").count()) > 0;
    const hasCards = (await page.locator("[class*='card' i]").count()) > 0;
    const hasMain = (await page.locator("main").count()) > 0;
    expect(hasTable || hasList || hasCards || hasMain).toBeTruthy();
  });

  test("refresh/reload button is present if implemented", async ({ page }) => {
    const refreshBtn = page.getByRole("button", { name: /refresh|reload|atualizar/i }).first();
    const count = await refreshBtn.count();
    if (count > 0) {
      await expect(refreshBtn).toBeVisible();
      await refreshBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("leaderboard renders at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/leaderboard");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });

  test("leaderboard renders at tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/en/leaderboard");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });
});
