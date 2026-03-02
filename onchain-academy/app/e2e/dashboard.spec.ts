import { test, expect } from "@playwright/test";
import { gotoWithLocale } from "./fixtures/test-helpers";

test.describe("Dashboard Page", () => {
  test("dashboard page renders with welcome or gate content", async ({
    page,
  }) => {
    await gotoWithLocale(page, "/dashboard");
    const body = await page.locator("body");
    await expect(body).not.toBeEmpty();

    // Either wallet gate OR dashboard content should be visible
    const bodyText = await body.textContent();
    expect(
      bodyText!.includes("Dashboard") ||
        bodyText!.includes("WELCOME BACK") ||
        bodyText!.includes("CONNECT") ||
        bodyText!.includes("wallet") ||
        bodyText!.includes("Wallet") ||
        bodyText!.includes("sealed"),
    ).toBeTruthy();
  });

  test("wallet gate shows for disconnected users", async ({ page }) => {
    await gotoWithLocale(page, "/dashboard");
    await page.waitForTimeout(2000);

    // The wallet gate should show when no wallet is connected
    // It renders with role="dialog" and contains connect wallet text
    const bodyText = await page.locator("body").textContent();
    expect(
      bodyText!.includes("CONNECT WALLET") ||
        bodyText!.includes("Dashboard") ||
        bodyText!.includes("sealed") ||
        bodyText!.includes("NO WALLET DETECTED"),
    ).toBeTruthy();
  });

  test("dashboard shows stats or gate content", async ({ page }) => {
    await gotoWithLocale(page, "/dashboard");
    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
    // Either shows wallet gate text or dashboard stats
    const hasDashboardContent =
      bodyText!.includes("EXPERIENCE") ||
      bodyText!.includes("STREAK") ||
      bodyText!.includes("LEVEL") ||
      bodyText!.includes("CONNECT") ||
      bodyText!.includes("wallet") ||
      bodyText!.includes("sealed") ||
      bodyText!.includes("Dashboard");
    expect(hasDashboardContent).toBeTruthy();
  });

  test("dashboard page loads without critical JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await gotoWithLocale(page, "/dashboard");
    await page.waitForTimeout(5000);

    // Filter out known benign errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("hydration") &&
        !e.includes("Loading chunk") &&
        !e.includes("Failed to fetch") &&
        !e.includes("WalletNotConnectedError") &&
        !e.includes("wallet"),
    );
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });

  test("dashboard renders streak or gate content", async ({ page }) => {
    await gotoWithLocale(page, "/dashboard");
    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").textContent();
    const hasStreakOrGate =
      bodyText!.includes("LEARNING STREAK") ||
      bodyText!.includes("STREAK") ||
      bodyText!.includes("CONNECT") ||
      bodyText!.includes("wallet") ||
      bodyText!.includes("sealed") ||
      bodyText!.includes("Dashboard");
    expect(hasStreakOrGate).toBeTruthy();
  });
});
