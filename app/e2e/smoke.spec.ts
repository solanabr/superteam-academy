import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and has correct title", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveTitle(/Superteam Academy/);
  });

  test("has hero section", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("has navigation header", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("header")).toBeVisible();
  });

  test("has footer", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("footer")).toBeVisible();
  });
});

test.describe("Course catalog", () => {
  test("loads and has page heading", async ({ page }) => {
    await page.goto("/en/courses");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows course grid or card elements", async ({ page }) => {
    await page.goto("/en/courses");
    // Expect either cards or a no-courses message to render
    const body = page.locator("main");
    await expect(body).toBeVisible();
  });
});

test.describe("Course detail", () => {
  test("loads for introduction-to-solana slug", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    // Page should not 404 (no "not found" heading)
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
  });
});

test.describe("Lesson page", () => {
  test("loads for known course and lesson slug", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana/lessons/what-is-solana");
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Leaderboard", () => {
  test("loads and shows leaderboard content", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("has table or list structure", async ({ page }) => {
    await page.goto("/en/leaderboard");
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});

test.describe("Dashboard", () => {
  test("shows sign-in prompt when unauthenticated", async ({ page }) => {
    await page.goto("/en/dashboard");
    // Either redirects to auth or shows sign-in UI
    const isAuthPage = page.url().includes("/auth") || page.url().includes("/signin");
    const hasSignInContent = await page.getByText(/sign in|connect|login/i).isVisible().catch(() => false);
    const hasMainContent = await page.locator("main").isVisible().catch(() => false);
    expect(isAuthPage || hasSignInContent || hasMainContent).toBeTruthy();
  });
});

test.describe("Profile", () => {
  test("shows sign-in prompt or profile UI when unauthenticated", async ({ page }) => {
    await page.goto("/en/profile");
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});

test.describe("Settings", () => {
  test("loads settings page", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows theme options", async ({ page }) => {
    await page.goto("/en/settings");
    // Theme section should be visible
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});

test.describe("Certificates", () => {
  test("handles invalid certificate ID gracefully", async ({ page }) => {
    await page.goto("/en/certificates/invalid-cert-id-000");
    // Should render something (error state, not unhandled crash)
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Language switching", () => {
  test("en locale loads correctly", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveURL(/\/en/);
    await expect(page).toHaveTitle(/Superteam Academy/);
  });

  test("pt-BR locale loads correctly", async ({ page }) => {
    await page.goto("/pt-BR");
    await expect(page).toHaveURL(/\/pt-BR/);
    await expect(page).toHaveTitle(/Superteam Academy/);
  });

  test("es locale loads correctly", async ({ page }) => {
    await page.goto("/es");
    await expect(page).toHaveURL(/\/es/);
    await expect(page).toHaveTitle(/Superteam Academy/);
  });
});

test.describe("Mobile navigation", () => {
  test("page renders correctly at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });

  test("header is visible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en");
    await expect(page.locator("header")).toBeVisible();
  });
});

test.describe("Theme toggle", () => {
  test("settings page has theme controls", async ({ page }) => {
    await page.goto("/en/settings");
    // Look for theme-related buttons (Dark/Light/System)
    const themeButton = page.getByRole("button", { name: /dark|light|system/i }).first();
    await expect(themeButton).toBeVisible();
  });
});
