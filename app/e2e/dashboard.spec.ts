import { test, expect } from "@playwright/test";

test.describe("My Learning Dashboard", () => {
  test("shows wallet connect prompt when not connected", async ({ page }) => {
    await page.goto("/en/my-learning");
    await expect(page.locator("text=Connect").first()).toBeVisible({ timeout: 15000 });
  });

  test("loading skeleton appears while fetching", async ({ page }) => {
    await page.goto("/en/my-learning");
    // Either skeleton or connect prompt should show quickly
    await expect(
      page.locator("[class*=skeleton], [class*=animate-pulse]")
        .or(page.locator("text=Connect"))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Creator Dashboard", () => {
  test("creator page loads with heading", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(
      page.locator("main h1").or(page.locator("main h2")).first()
    ).toBeVisible({ timeout: 15000 });
  });
});
