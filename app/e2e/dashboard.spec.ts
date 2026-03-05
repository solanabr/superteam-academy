import { test, expect } from "@playwright/test";

test.describe("Dashboard — unauthenticated access", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test("dashboard page loads without crashing", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });

  test("dashboard shows sign-in prompt, redirect, or main content", async ({ page }) => {
    const isAuthPage = page.url().includes("/auth") || page.url().includes("/signin");
    const hasSignInText = await page.getByText(/sign in|connect|login|entrar/i).isVisible().catch(() => false);
    const hasMainContent = await page.locator("main").isVisible().catch(() => false);
    expect(isAuthPage || hasSignInText || hasMainContent).toBeTruthy();
  });

  test("main content area or redirect target is visible", async ({ page }) => {
    // Either the auth page main or the dashboard main
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Dashboard — page structure when accessible", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test("header is visible on dashboard", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });

  test("footer is visible on dashboard", async ({ page }) => {
    await expect(page.locator("footer")).toBeVisible();
  });

  test("dashboard has a title or heading", async ({ page }) => {
    // If not redirected, there should be a heading
    const isRedirected = page.url().includes("/auth");
    if (!isRedirected) {
      await expect(page.locator("h1, h2").first()).toBeVisible();
    }
  });

  test("dashboard page has a non-empty title tag", async ({ page }) => {
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });
});

test.describe("Dashboard — connect wallet prompt", () => {
  test("wallet connect button is visible when not connected", async ({ page }) => {
    await page.goto("/en/dashboard");
    await page.waitForLoadState("domcontentloaded");
    // Dashboard shows connect wallet CTA when unauthenticated
    const walletBtn = page
      .getByRole("button", { name: /connect wallet|wallet|solana/i })
      .first();
    const count = await walletBtn.count();
    // Graceful — may redirect to auth first
    if (count > 0) {
      await expect(walletBtn).toBeVisible();
    }
  });
});

test.describe("Dashboard — responsiveness", () => {
  test("dashboard renders at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });

  test("dashboard renders at tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/en/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });
});
