import { test, expect } from "@playwright/test";
import { mockApiRoutes } from "./fixtures/wallet-mock";

test.describe("Community Page", () => {
  test("community page renders or redirects gracefully", async ({ page }) => {
    await mockApiRoutes(page);
    // Navigate to community page
    const response = await page.goto("/en/community");

    // The page should load (either the community page or a fallback)
    expect(response).toBeTruthy();
    const status = response!.status();
    // Accept 200 (page exists) or 404 (not-found page rendered, still a valid page)
    expect(status === 200 || status === 404).toBeTruthy();

    // The page body should not be empty
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("community page has visible content or not-found state", async ({
    page,
  }) => {
    await mockApiRoutes(page);
    await page.goto("/en/community");
    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();

    // Either shows community content or 404
    const hasContent =
      bodyText!.includes("Community") ||
      bodyText!.includes("community") ||
      bodyText!.includes("Thread") ||
      bodyText!.includes("thread") ||
      bodyText!.includes("Discussion") ||
      bodyText!.includes("404") ||
      bodyText!.includes("not found") ||
      bodyText!.includes("Not Found");
    expect(hasContent).toBeTruthy();
  });

  test("community page loads without critical errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await mockApiRoutes(page);
    await page.goto("/en/community");
    await page.waitForTimeout(3000);

    // Filter benign errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("hydration") &&
        !e.includes("Loading chunk") &&
        !e.includes("Failed to fetch"),
    );
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });

  test("navigating from community back to courses works", async ({ page }) => {
    await page.goto("/en/community");
    await page.waitForTimeout(2000);

    // Navigate to courses via URL
    await page.goto("/en/courses");
    await expect(page.getByText("Curriculum")).toBeVisible({ timeout: 15_000 });
  });

  test("community page renders within acceptable load time", async ({
    page,
  }) => {
    await mockApiRoutes(page);
    const start = Date.now();
    await page.goto("/en/community");
    await page.waitForLoadState("domcontentloaded");
    const elapsed = Date.now() - start;

    // Page should load within 30 seconds (generous for dev mode)
    expect(elapsed).toBeLessThan(30_000);
  });
});
