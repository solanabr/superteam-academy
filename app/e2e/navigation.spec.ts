import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("root / redirects to /en", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/en");
    expect(page.url()).toContain("/en");
  });

  test("navigate from landing to courses", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Courses" }).first().click();
    await page.waitForURL("**/courses");
    await expect(
      page.getByRole("heading", { name: "Courses" })
    ).toBeVisible();
  });

  test("navigate from landing to leaderboard", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Leaderboard" }).first().click();
    await page.waitForURL("**/leaderboard");
    await expect(
      page.getByRole("heading", { name: "Leaderboard" })
    ).toBeVisible();
  });

  test("navigate from landing to dashboard", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Dashboard" }).first().click();
    await page.waitForURL("**/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
  });

  test("navigate to community page", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Community" }).first().click();
    await page.waitForURL("**/community");
    await expect(
      page.getByRole("heading", { name: "Community" })
    ).toBeVisible();
  });

  test("Start Learning Free links to onboarding", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Start Learning Free" }).click();
    await page.waitForURL("**/onboarding");
  });
});
