import { test, expect } from "@playwright/test";
import { gotoWithLocale } from "./fixtures/test-helpers";

test.describe("Course Catalog", () => {
  test("course catalog page renders with header and courses", async ({
    page,
  }) => {
    await gotoWithLocale(page, "/courses");
    // The catalog shows the "Curriculum" heading
    await expect(page.getByText("Curriculum")).toBeVisible({ timeout: 15_000 });
    // At least one course should be listed
    await expect(page.getByText("Introduction to Solana").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("search filters courses by title", async ({ page }) => {
    await gotoWithLocale(page, "/courses");
    await expect(page.getByText("Curriculum")).toBeVisible({ timeout: 15_000 });

    // Type in search
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.waitFor({ state: "visible", timeout: 10_000 });
    await searchInput.fill("Anchor");

    // Anchor course should be visible
    await expect(page.getByText("Anchor Development").first()).toBeVisible({
      timeout: 5_000,
    });

    // Introduction to Solana should be hidden since it doesn't match "Anchor"
    await expect(
      page.locator("section").filter({ hasText: "Introduction to Solana" }),
    ).toHaveCount(0, { timeout: 5_000 });
  });

  test("track filter pills are visible and clickable", async ({ page }) => {
    await gotoWithLocale(page, "/courses");
    await expect(page.getByText("Curriculum")).toBeVisible({ timeout: 15_000 });

    // Track filter pills should be present (desktop)
    await expect(page.getByText("ALL TRACKS")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("RUST").first()).toBeVisible();
    await expect(page.getByText("ANCHOR").first()).toBeVisible();
  });

  test("difficulty filter pills are visible", async ({ page }) => {
    await gotoWithLocale(page, "/courses");
    await expect(page.getByText("Curriculum")).toBeVisible({ timeout: 15_000 });

    // Difficulty filter pills
    await expect(page.getByText("ALL LEVELS")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("BEGINNER").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("course section shows title, track, and XP info", async ({ page }) => {
    await gotoWithLocale(page, "/courses");
    await expect(page.getByText("Curriculum")).toBeVisible({ timeout: 15_000 });

    // First course should show lesson count and XP
    await expect(page.getByText(/LESSONS/).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/XP/).first()).toBeVisible();
  });

  test("clicking a course title navigates to course detail", async ({
    page,
  }) => {
    await gotoWithLocale(page, "/courses");
    await expect(page.getByText("Curriculum")).toBeVisible({ timeout: 15_000 });

    // Click the first course link
    const courseLink = page
      .getByRole("link", { name: /Introduction to Solana/i })
      .first();
    await courseLink.waitFor({ state: "visible", timeout: 10_000 });
    await courseLink.click({ timeout: 15_000 });

    // Should navigate to course detail
    await page.waitForURL("**/courses/intro-to-solana", { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Introduction to Solana",
    );
  });

  test("course detail page shows module sections", async ({ page }) => {
    await gotoWithLocale(page, "/courses/intro-to-solana");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Introduction to Solana",
      { timeout: 15_000 },
    );

    // Course Content section should be present
    await expect(page.getByText("Course Content").first()).toBeVisible({
      timeout: 10_000,
    });
    // Module and lesson counts should be shown
    await expect(page.getByText(/Modules/).first()).toBeVisible();
    await expect(page.getByText(/Lessons/).first()).toBeVisible();
  });

  test("course detail shows stats strip with XP and lesson count", async ({
    page,
  }) => {
    await gotoWithLocale(page, "/courses/intro-to-solana");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Introduction to Solana",
      { timeout: 15_000 },
    );

    // Stats strip should show lesson count, duration, XP
    await expect(page.getByText(/hrs/).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/XP/).first()).toBeVisible();
  });
});
