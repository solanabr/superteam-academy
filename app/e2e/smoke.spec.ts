import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("landing page loads and shows hero content", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveTitle(/Superteam Academy/);
    await expect(
      page.getByRole("link", { name: /courses/i }).first(),
    ).toBeVisible();
    await expect(page.getByText("Master Solana Development")).toBeVisible();
  });

  test("courses page loads and shows catalog", async ({ page }) => {
    await page.goto("/en/courses");
    await expect(page).toHaveTitle(/Courses/);
    await expect(page.getByText("Course Catalog")).toBeVisible();
    // At least one course card should render
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
    // Dashboard shows demo mode when no wallet is connected
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("leaderboard page renders with rankings", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await expect(
      page.getByRole("heading", { name: /leaderboard/i }),
    ).toBeVisible();
    // The leaderboard table should appear after loading
    await expect(
      page.getByRole("table", { name: /leaderboard rankings/i }),
    ).toBeVisible({ timeout: 10_000 });
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
    await expect(page.getByText("Appearance")).toBeVisible();
  });

  test("certificates page renders", async ({ page }) => {
    await page.goto("/en/certificates");
    // Title or heading for credentials/certificates
    await expect(page.getByText("Credentials").first()).toBeVisible();
  });

  test("admin dashboard renders", async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page.getByText("Admin Dashboard")).toBeVisible();
    await expect(page.getByText("Course Management")).toBeVisible();
  });
});
