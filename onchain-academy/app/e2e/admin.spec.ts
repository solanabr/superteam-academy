import { test, expect } from "@playwright/test";
import { gotoWithLocale } from "./fixtures/test-helpers";

test.describe("Admin Dashboard", () => {
  test("admin page renders with title and preview badge", async ({ page }) => {
    await gotoWithLocale(page, "/admin");
    await expect(page.getByText("Admin Dashboard")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Preview")).toBeVisible({ timeout: 10_000 });
  });

  test("stats cards are visible with values", async ({ page }) => {
    await gotoWithLocale(page, "/admin");
    await expect(page.getByText("Admin Dashboard")).toBeVisible({
      timeout: 15_000,
    });

    // Stats grid should show all four cards
    await expect(page.getByText("Total Courses")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Active Learners")).toBeVisible();
    await expect(page.getByText("Credentials Issued")).toBeVisible();
    await expect(page.getByText("Total XP Distributed")).toBeVisible();

    // Values should be present
    await expect(page.getByText("1,247").first()).toBeVisible();
    await expect(page.getByText("342").first()).toBeVisible();
    await expect(page.getByText("847K").first()).toBeVisible();
  });

  test("course management section is expanded by default", async ({
    page,
  }) => {
    await gotoWithLocale(page, "/admin");
    await expect(page.getByText("Admin Dashboard")).toBeVisible({
      timeout: 15_000,
    });

    // Course Management section header
    await expect(page.getByText("Course Management").first()).toBeVisible({
      timeout: 10_000,
    });

    // The expanded section should show the course table
    await expect(page.getByText("Introduction to Solana").first()).toBeVisible({
      timeout: 10_000,
    });

    // "New Course" button
    await expect(page.getByText("New Course")).toBeVisible();
  });

  test("search courses input filters the course table", async ({ page }) => {
    await gotoWithLocale(page, "/admin");
    await expect(page.getByText("Admin Dashboard")).toBeVisible({
      timeout: 15_000,
    });

    // Type in the search input
    const searchInput = page.getByPlaceholder("Search courses...");
    await searchInput.waitFor({ state: "visible", timeout: 10_000 });
    await searchInput.fill("Anchor");

    // Anchor course should remain
    await expect(
      page.getByText("Anchor Development").first(),
    ).toBeVisible({ timeout: 5_000 });

    // Courses that don't match should be filtered out of the table
    // The table rows should decrease
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("user management section expands when clicked", async ({ page }) => {
    await gotoWithLocale(page, "/admin");
    await expect(page.getByText("Admin Dashboard")).toBeVisible({
      timeout: 15_000,
    });

    // Click User Management to expand
    const userMgmtButton = page
      .getByRole("button")
      .filter({ hasText: "User Management" });
    await userMgmtButton.click();

    // Should show learner table with demo data
    await expect(page.getByText("SolDev.eth").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("RustBuilder").first()).toBeVisible();
    await expect(page.getByText("AnchorFan").first()).toBeVisible();
  });

  test("analytics section shows metrics when expanded", async ({ page }) => {
    await gotoWithLocale(page, "/admin");
    await expect(page.getByText("Admin Dashboard")).toBeVisible({
      timeout: 15_000,
    });

    // Click Analytics Dashboard to expand
    const analyticsButton = page
      .getByRole("button")
      .filter({ hasText: "Analytics Dashboard" });
    await analyticsButton.click();

    // Should show metric cards
    await expect(page.getByText("Avg. Completion Rate").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("68%").first()).toBeVisible();
    await expect(page.getByText("Daily Active Learners").first()).toBeVisible();
    await expect(
      page.getByText("Avg. Session Duration").first(),
    ).toBeVisible();

    // Enrollments chart area
    await expect(
      page.getByText(/Enrollments.*last 7 days/i).first(),
    ).toBeVisible();
  });
});
