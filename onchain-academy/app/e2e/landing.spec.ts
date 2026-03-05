import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
  });

  test("renders hero section with heading and CTAs", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Learn to build on Solana");

    const startLearningBtn = page.getByRole("link", {
      name: "Start Learning Free",
    });
    await expect(startLearningBtn).toBeVisible();
    await expect(startLearningBtn).toHaveAttribute("href", "/en/onboarding");

    const exploreCoursesBtn = page.getByRole("link", {
      name: "Explore Courses",
    });
    await expect(exploreCoursesBtn).toBeVisible();
  });

  test("renders stats section", async ({ page }) => {
    await expect(page.getByText("12+")).toBeVisible();
    await expect(page.getByText("150+")).toBeVisible();
    await expect(page.getByText("2.4M")).toBeVisible();
    await expect(page.getByText("850+")).toBeVisible();
  });

  test("renders features section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Why Superteam Academy" })
    ).toBeVisible();
    await expect(page.getByText("Interactive Courses")).toBeVisible();
    await expect(page.getByText("On-Chain XP")).toBeVisible();
    await expect(page.getByText("Credential NFTs")).toBeVisible();
  });

  test("renders learning paths section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Learning Paths" })
    ).toBeVisible();
    await expect(page.getByText("Solana Fundamentals")).toBeVisible();
    await expect(page.getByText("Anchor Development")).toBeVisible();
    await expect(page.getByText("Token Engineering")).toBeVisible();
  });

  test("renders header with navigation links", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Courses" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Leaderboard" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Dashboard" }).first()
    ).toBeVisible();
  });

  test("renders footer with copyright", async ({ page }) => {
    await expect(page.getByText("Superteam Brazil")).toBeVisible();
  });

  test("Connect Wallet button is visible", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Connect Wallet" })
    ).toBeVisible();
  });
});
