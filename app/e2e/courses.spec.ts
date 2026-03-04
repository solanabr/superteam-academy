import { test, expect } from "@playwright/test";

test.describe("Courses Page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase API to avoid external dependency
    await page.route("**/rest/v1/courses**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "1",
            slug: "solana-fundamentals",
            title: "Solana Fundamentals",
            description: "Learn the basics of Solana blockchain development",
            category: "solana",
            difficulty: "beginner",
            lesson_count: 12,
            duration_minutes: 180,
            xp_reward: 500,
            order_index: 1,
            is_published: true,
          },
          {
            id: "2",
            slug: "anchor-development",
            title: "Anchor Development",
            description: "Build Solana programs with Anchor framework",
            category: "rust",
            difficulty: "intermediate",
            lesson_count: 15,
            duration_minutes: 300,
            xp_reward: 800,
            order_index: 2,
            is_published: true,
          },
        ]),
      });
    });

    await page.goto("/en/courses");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Courses" })
    ).toBeVisible();
  });

  test("renders course cards from mocked data", async ({ page }) => {
    await expect(page.getByText("Solana Fundamentals")).toBeVisible();
    await expect(page.getByText("Anchor Development")).toBeVisible();
  });

  test("renders difficulty badges", async ({ page }) => {
    await expect(page.getByText("beginner").first()).toBeVisible();
    await expect(page.getByText("intermediate").first()).toBeVisible();
  });

  test("shows category filter buttons", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /All/i }).first()
    ).toBeVisible();
  });
});

test.describe("Courses Page — Empty State", () => {
  test("shows empty state when no courses", async ({ page }) => {
    await page.route("**/rest/v1/courses**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/en/courses");
    await expect(page.getByText("No courses found")).toBeVisible();
  });
});
