import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/dashboard");
  });

  test("renders dashboard heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Dashboard" })
    ).toBeVisible();
  });

  test("renders stat cards", async ({ page }) => {
    await expect(page.getByText("Total XP")).toBeVisible();
    await expect(page.getByText("Day Streak")).toBeVisible();
    await expect(page.getByText("Current Level")).toBeVisible();
  });

  test("renders enrolled courses section", async ({ page }) => {
    await expect(page.getByText("Enrolled Courses")).toBeVisible();
  });

  test("shows Browse Courses button", async ({ page }) => {
    // Either in empty state or sidebar
    const browseBtn = page.getByRole("link", { name: /Browse.*Courses/i });
    await expect(browseBtn.first()).toBeVisible();
  });
});

test.describe("Settings Page — Unauthenticated", () => {
  test("shows connect wallet message when not authenticated", async ({
    page,
  }) => {
    await page.goto("/en/settings");
    await expect(
      page.getByText("Please connect your wallet")
    ).toBeVisible();
  });
});

test.describe("Community Page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Supabase threads query
    await page.route("**/rest/v1/threads**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/en/community");
  });

  test("renders community heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Community" })
    ).toBeVisible();
  });

  test("renders subtitle", async ({ page }) => {
    await expect(
      page.getByText("Ask questions, share projects")
    ).toBeVisible();
  });

  test("shows Sign in to Post button when unauthenticated", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: /Sign in to Post/i })
    ).toBeVisible();
  });

  test("shows tag filter buttons", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "All" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Question" })
    ).toBeVisible();
  });
});
