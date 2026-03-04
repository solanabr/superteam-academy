import { test, expect } from "@playwright/test";

test.describe("Challenges Page", () => {
  test("daily challenges page loads with heading", async ({ page }) => {
    await page.goto("/challenges");
    await expect(page.locator("main")).toBeVisible();

    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(/challenge/i);
  });

  test("challenge overview shows action button", async ({ page }) => {
    await page.goto("/challenges");
    await expect(page.locator("h1")).toBeVisible();

    const actionButton = page
      .locator("a, button")
      .filter({ hasText: /start|continue|solve|view/i });
    await expect(actionButton.first()).toBeVisible();
  });

  test("challenges page has sidebar navigation", async ({ page }) => {
    await page.goto("/challenges");
    await expect(page.locator("main")).toBeVisible();

    const dailyChallengesLink = page.locator("a").filter({
      hasText: /daily challenges/i,
    });
    await expect(dailyChallengesLink.first()).toBeVisible();
  });
});
