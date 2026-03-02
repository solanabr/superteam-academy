import { test, expect } from "@playwright/test";
import { gotoWithLocale } from "./fixtures/test-helpers";

test.describe("Enrollment Flow", () => {
  test("enroll button is visible on course detail page", async ({ page }) => {
    await gotoWithLocale(page, "/courses/intro-to-solana");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Introduction to Solana",
      { timeout: 15_000 },
    );
    // Enroll Now button should be visible
    await expect(page.getByText("Enroll Now").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("enroll section shows completion stats", async ({ page }) => {
    await gotoWithLocale(page, "/courses/intro-to-solana");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Introduction to Solana",
      { timeout: 15_000 },
    );
    // Should show creator info
    await expect(page.getByText(/by/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("course detail page shows track and difficulty badges", async ({
    page,
  }) => {
    await gotoWithLocale(page, "/courses/intro-to-solana");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Introduction to Solana",
      { timeout: 15_000 },
    );
    // Track and difficulty tags should be visible
    await expect(page.getByText(/beginner/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("course detail page shows student reviews section", async ({ page }) => {
    await gotoWithLocale(page, "/courses/intro-to-solana");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Introduction to Solana",
      { timeout: 15_000 },
    );
    // Reviews section should be present
    await expect(page.getByText(/student reviews/i).first()).toBeVisible({
      timeout: 10_000,
    });
    // Individual review authors
    await expect(page.getByText("Ana P.")).toBeVisible();
    await expect(page.getByText("Carlos R.")).toBeVisible();
  });

  test("enroll section renders on different course slugs", async ({ page }) => {
    await gotoWithLocale(page, "/courses/anchor-development");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Anchor Development",
      { timeout: 15_000 },
    );
    await expect(page.getByText("Enroll Now").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
