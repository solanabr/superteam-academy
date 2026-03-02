import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("landing page loads and shows hero content", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveTitle(/Superteam Academy/);
    await expect(
      page.getByRole("link", { name: /courses/i }).first(),
    ).toBeVisible();
    // Hero renders heroHeadline ("Learn") + heroOnChain ("on-chain.")
    await expect(page.getByText("Learn").first()).toBeVisible();
  });

  test("courses page loads and shows catalog", async ({ page }) => {
    await page.goto("/en/courses");
    await expect(page).toHaveTitle(/Courses/);
    await expect(page.getByText("Curriculum")).toBeVisible();
    // Static fallback course data is always available
    await expect(
      page.getByText("Introduction to Solana").first(),
    ).toBeVisible();
  });

  test("course detail page loads for intro-to-solana", async ({ page }) => {
    await page.goto("/en/courses/intro-to-solana");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Introduction to Solana",
    );
    await expect(page.getByText("Enroll Now")).toBeVisible();
    await expect(page.getByText("Course Content")).toBeVisible();
  });

  test("lesson page loads for first lesson", async ({ page }) => {
    // Lesson ID "l-1-1" corresponds to "What is Solana?"
    await page.goto("/en/courses/intro-to-solana/lessons/l-1-1");
    await expect(page.getByText(/What is Solana/i).first()).toBeVisible();
  });

  test("dashboard page renders", async ({ page }) => {
    await page.goto("/en/dashboard");
    // Dashboard shows wallet gate or welcome content when no wallet is connected
    const body = await page.locator("body").textContent();
    expect(
      body!.includes("WELCOME BACK") ||
        body!.includes("CONNECT") ||
        body!.includes("wallet") ||
        body!.includes("Wallet"),
    ).toBeTruthy();
  });

  test("leaderboard page renders with heading", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await expect(
      page.getByRole("heading", { name: /leaderboard/i }),
    ).toBeVisible({ timeout: 15_000 });
    // Timeframe tabs should be visible
    await expect(page.getByText("ALL TIME")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("profile page renders", async ({ page }) => {
    await page.goto("/en/profile");
    // Demo profile should show the demo user name
    await expect(page.getByText("SolDev.eth").first()).toBeVisible();
    await expect(page.getByText(/Total XP/i).first()).toBeVisible();
  });

  test("public profile page renders", async ({ page }) => {
    // Public profile route with a username param
    await page.goto("/en/profile/soldev");
    // Should not crash -- either shows a profile or a not-found state
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("settings page renders", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(
      page.getByRole("heading", { name: /settings/i }),
    ).toBeVisible();
    await expect(page.getByText("Appearance").first()).toBeVisible();
  });

  test("certificates page renders", async ({ page }) => {
    await page.goto("/en/certificates");
    // Title or heading for credentials/certificates
    await expect(page.getByText("Credentials").first()).toBeVisible();
  });

  test("admin page renders gate or dashboard", async ({ page }) => {
    await page.goto("/en/admin");
    // Admin shows password gate when not authenticated
    const body = await page.locator("body").textContent();
    expect(
      body!.includes("Admin") ||
        body!.includes("admin") ||
        body!.includes("Password") ||
        body!.includes("password"),
    ).toBeTruthy();
  });
});
