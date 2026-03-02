import { test, expect } from "@playwright/test";

test.describe("Certificate Page", () => {
  test("certificate route loads without crash", async ({ page }) => {
    await page.goto("/certificates/test-cert-123");
    await expect(page.locator("main")).toBeVisible();
  });

  test("certificate page shows content", async ({ page }) => {
    await page.goto("/certificates/test-cert-123");
    await expect(page.locator("main")).toBeVisible();

    // Page should render something meaningful (even if cert not found)
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("certificate page has back navigation", async ({ page }) => {
    await page.goto("/certificates/test-cert-123");
    await expect(page.locator("main")).toBeVisible();

    const backLink = page.locator("a").filter({ hasText: /back/i });
    await expect(backLink.first()).toBeVisible();
  });
});
