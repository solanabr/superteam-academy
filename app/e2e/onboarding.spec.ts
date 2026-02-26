import { test, expect } from "@playwright/test";

test.describe("Onboarding page", () => {
  test("loads onboarding flow", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(
      page.getByRole("heading", { name: /onboarding|welcome|skill|assessment/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test("skill assessment quiz is present", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(
      page.getByText(/experience|rust|goal|beginner|intermediate/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
