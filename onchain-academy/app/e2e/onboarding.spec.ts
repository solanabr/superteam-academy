import { test, expect } from "@playwright/test";

test.describe("Onboarding Quiz", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/onboarding");
  });

  test("renders first question", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 2 })).toContainText(
      "How would you find the best Solana tutorial"
    );
    await expect(page.getByText("Question 1 of 4")).toBeVisible();
  });

  test("shows 4 answer options per question", async ({ page }) => {
    await expect(page.getByText("Search docs.solana.com")).toBeVisible();
    await expect(page.getByText("Ask in Discord")).toBeVisible();
    await expect(page.getByText("Watch YouTube")).toBeVisible();
    await expect(page.getByText("Try building something")).toBeVisible();
  });

  test("Next button is disabled until an option is selected", async ({
    page,
  }) => {
    const nextBtn = page.getByRole("button", { name: /Next/i });
    await expect(nextBtn).toBeDisabled();

    // Select first option
    await page.getByText("Search docs.solana.com").click();
    await expect(nextBtn).toBeEnabled();
  });

  test("can advance through all 4 questions", async ({ page }) => {
    // Q1
    await page.getByText("Search docs.solana.com").click();
    await page.getByRole("button", { name: /Next/i }).click();

    // Q2
    await expect(page.getByText("Question 2 of 4")).toBeVisible();
    await expect(page.getByText("100 XP")).toBeVisible();
    await page.getByText("Guaranteed Bronze badge").click();
    await page.getByRole("button", { name: /Next/i }).click();

    // Q3
    await expect(page.getByText("Question 3 of 4")).toBeVisible();
    await expect(page.getByText("Where are you right now")).toBeVisible();
    await page.getByText("Never written Rust before").click();
    await page.getByRole("button", { name: /Next/i }).click();

    // Q4
    await expect(page.getByText("Question 4 of 4")).toBeVisible();
    await expect(page.getByText("What do you want to build")).toBeVisible();
  });

  test("completing quiz shows match and redirects", async ({ page }) => {
    // Go through all questions quickly
    await page.getByText("Search docs.solana.com").click();
    await page.getByRole("button", { name: /Next/i }).click();

    await page.getByText("Guaranteed Bronze badge").click();
    await page.getByRole("button", { name: /Next/i }).click();

    // Select "beginner" to get solana-fundamentals redirect
    await page.getByText("Never written Rust before").click();
    await page.getByRole("button", { name: /Next/i }).click();

    await page.getByText("DeFi protocol").click();
    await page.getByRole("button", { name: /Find my path/i }).click();

    // Should show match found screen
    await expect(page.getByText("Perfect match found")).toBeVisible();

    // Should redirect to courses after delay
    await page.waitForURL("**/courses/**", { timeout: 5000 });
  });
});
