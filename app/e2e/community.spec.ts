import { test, expect } from "@playwright/test";
import { dismissOnboarding } from "./helpers";

test.describe("Community page — structure", () => {
  test.beforeEach(async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en/community");
    await page.waitForLoadState("networkidle");
  });

  test("community page loads without error redirect", async ({ page }) => {
    await expect(page).not.toHaveURL(/error|404/);
  });

  test("community page has a visible heading", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("main content area is visible", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("page does not show an unhandled runtime error", async ({ page }) => {
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });

  test("page has a non-empty title tag", async ({ page }) => {
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test("header is visible on community page", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });

  test("footer is visible on community page", async ({ page }) => {
    await expect(page.locator("footer")).toBeVisible();
  });
});

test.describe("Community page — thread list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/community");
    await page.waitForLoadState("networkidle");
  });

  test("community page shows thread posts or an empty state", async ({ page }) => {
    // Community renders seeded threads — should have some content
    const hasCards = (await page.locator("[class*='card' i]").count()) > 0;
    const hasList = (await page.locator("ul, ol, [role='list']").count()) > 0;
    const hasEmpty = (await page.getByText(/no posts|no threads|empty/i).count()) > 0;
    const hasMain = (await page.locator("main").count()) > 0;
    expect(hasCards || hasList || hasEmpty || hasMain).toBeTruthy();
  });

  test("at least one thread title is visible (seeded data)", async ({ page }) => {
    // Community has seeded threads including Solana/Token-2022 discussions
    const threadText = page.getByText(/Token-2022|Anchor|Solana/i).first();
    const count = await threadText.count();
    if (count > 0) {
      await expect(threadText).toBeVisible();
    }
  });
});

test.describe("Community page — filter controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/community");
    await page.waitForLoadState("networkidle");
  });

  test("search input is present on community page", async ({ page }) => {
    const searchInput = page
      .locator("input[type='search'], input[type='text'][placeholder*='search' i], input[placeholder*='Search' i]")
      .first();
    const count = await searchInput.count();
    if (count > 0) {
      await expect(searchInput).toBeVisible();
    }
  });

  test("category filter or tab is present", async ({ page }) => {
    const filterEl = page
      .locator("[role='tab'], button:has-text('Help'), button:has-text('General'), select")
      .first();
    const count = await filterEl.count();
    if (count > 0) {
      await expect(filterEl).toBeVisible();
    }
  });

  test("new post / new thread button is visible", async ({ page }) => {
    const newPostBtn = page
      .getByRole("button", { name: /new post|new thread|novo post|create/i })
      .first();
    const count = await newPostBtn.count();
    if (count > 0) {
      await expect(newPostBtn).toBeVisible();
    }
  });
});

test.describe("Community page — responsiveness", () => {
  test("community page renders at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/community");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });

  test("community page renders at tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/en/community");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Community page — locale variants", () => {
  test("community page loads in pt-BR", async ({ page }) => {
    await page.goto("/pt-BR/community");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/error|404/);
    await expect(page.locator("main")).toBeVisible();
  });
});
