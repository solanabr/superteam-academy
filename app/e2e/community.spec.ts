import { test, expect } from "@playwright/test";

test.describe("Community page", () => {
  test("loads community forum", async ({ page }) => {
    await page.goto("/community");
    await expect(page.getByRole("heading", { name: /community|forum|discuss/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows discussion threads or categories", async ({ page }) => {
    await page.goto("/community");
    await expect(
      page.getByText(/discussion|thread|q&a|showcase|category/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
