import { test, expect } from "@playwright/test";

test.describe("Courses page", () => {
  test("loads course list", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.getByRole("heading", { name: /courses/i })).toBeVisible();
  });

  test("shows course cards or grid", async ({ page }) => {
    await page.goto("/courses");
    await expect(
      page.getByRole("link", { name: /enroll|view|start/i }).or(page.locator("a[href*='/courses/']"))
    ).toBeVisible({ timeout: 8000 });
  });
});
