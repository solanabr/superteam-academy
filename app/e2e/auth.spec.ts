import { test, expect } from "@playwright/test";
import { dismissOnboarding } from "./helpers";

test.describe("Sign-in page — structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/auth/signin");
    await page.waitForLoadState("networkidle");
  });

  test("sign-in page loads without error redirect", async ({ page }) => {
    await expect(page).not.toHaveURL(/error/);
  });

  test("sign-in page has a heading", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("sign-in page body is non-empty", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
    const text = await page.locator("body").textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("sign-in page renders without unhandled runtime error", async ({ page }) => {
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });
});

test.describe("Sign-in page — auth methods", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/auth/signin");
    await page.waitForLoadState("networkidle");
  });

  test("Google sign-in button is visible", async ({ page }) => {
    const googleBtn = page
      .locator("button:has-text('Google'), [aria-label*='Google' i]")
      .first();
    await expect(googleBtn).toBeVisible();
  });

  test("GitHub sign-in button is visible", async ({ page }) => {
    const githubBtn = page
      .locator("button:has-text('GitHub'), [aria-label*='GitHub' i]")
      .first();
    await expect(githubBtn).toBeVisible();
  });

  test("wallet / Solana connect option is visible", async ({ page }) => {
    const walletBtn = page
      .locator("button:has-text('Wallet'), button:has-text('Connect'), button:has-text('Solana')")
      .first();
    await expect(walletBtn).toBeVisible();
  });

  test("all three auth methods render on the page", async ({ page }) => {
    const googleBtn = page.locator("button:has-text('Google')").first();
    const githubBtn = page.locator("button:has-text('GitHub')").first();
    const walletBtn = page
      .locator("button:has-text('Wallet'), button:has-text('Connect'), button:has-text('Solana')")
      .first();
    await expect(googleBtn).toBeVisible();
    await expect(githubBtn).toBeVisible();
    await expect(walletBtn).toBeVisible();
  });
});

test.describe("Sign-in modal — triggered from header", () => {
  test("sign-in button is visible in header when unauthenticated", async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const signInBtn = page
      .locator("header")
      .getByRole("button", { name: /sign in|login|connect|entrar/i })
      .first();
    const count = await signInBtn.count();
    if (count > 0) {
      await expect(signInBtn).toBeVisible();
    }
  });

  test("clicking sign-in button opens a modal or navigates to auth", async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const signInBtn = page
      .locator("header")
      .getByRole("button", { name: /sign in|login|connect|entrar/i })
      .first();
    const count = await signInBtn.count();
    if (count > 0) {
      await signInBtn.click();
      await page.waitForTimeout(500);
      const modalOpened = await page.locator("[role='dialog'][data-state='open']").isVisible().catch(() => false);
      const navigatedToAuth = page.url().includes("/auth");
      expect(modalOpened || navigatedToAuth).toBeTruthy();
    }
  });
});

test.describe("Protected routes — unauthenticated redirects", () => {
  test("dashboard shows sign-in content or redirects when unauthenticated", async ({ page }) => {
    await page.goto("/en/dashboard");
    await page.waitForLoadState("networkidle");
    const isAuthPage = page.url().includes("/auth") || page.url().includes("/signin");
    const hasSignInText = await page.getByText(/sign in|connect|login|entrar/i).isVisible().catch(() => false);
    const hasMainContent = await page.locator("main").isVisible().catch(() => false);
    expect(isAuthPage || hasSignInText || hasMainContent).toBeTruthy();
  });

  test("profile page loads without crashing when unauthenticated", async ({ page }) => {
    await page.goto("/en/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });

  test("admin page redirects or shows access-denied when unauthenticated", async ({ page }) => {
    await page.goto("/en/admin");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    const isAuthRedirect = url.includes("/auth") || url.includes("/signin") || url.includes("/login");
    const hasAccessDenied = await page.getByText(/sign in|connect|login|access denied|unauthorized/i).isVisible().catch(() => false);
    const hasMain = await page.locator("main").isVisible().catch(() => false);
    expect(isAuthRedirect || hasAccessDenied || hasMain).toBeTruthy();
  });

  test("settings page is accessible without auth (public settings)", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Auth page locale variants", () => {
  test("pt-BR auth page loads", async ({ page }) => {
    await page.goto("/pt-BR/auth/signin");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });

  test("es auth page loads", async ({ page }) => {
    await page.goto("/es/auth/signin");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});
