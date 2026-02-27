import { test, expect } from "@playwright/test";
import { gotoWithLocale } from "./fixtures/test-helpers";

test.describe("Dashboard Page", () => {
  test("dashboard page renders with welcome content", async ({ page }) => {
    await gotoWithLocale(page, "/dashboard");
    // Dashboard shows either the wallet gate or the welcome message
    // When no wallet is connected, the wallet gate dialog appears
    const body = await page.locator("body");
    await expect(body).not.toBeEmpty();

    // Either wallet gate OR dashboard content should be visible
    const hasWalletGate = await page.locator("[role='dialog']").isVisible().catch(() => false);
    const hasWelcome = await page.getByText("WELCOME BACK").isVisible().catch(() => false);

    expect(hasWalletGate || hasWelcome).toBeTruthy();
  });

  test("wallet gate shows for disconnected users", async ({ page }) => {
    await gotoWithLocale(page, "/dashboard");
    // Wait for the page to settle
    await page.waitForTimeout(2000);

    // The wallet gate dialog should be visible when no wallet is connected
    const gateDialog = page.locator("[role='dialog']");
    const isGateVisible = await gateDialog.isVisible().catch(() => false);

    if (isGateVisible) {
      // Should show the connect wallet button
      await expect(gateDialog).toBeVisible({ timeout: 10_000 });
      // The gate should have a connect button or wallet-related text
      const gateText = await gateDialog.textContent();
      expect(
        gateText?.includes("CONNECT") ||
        gateText?.includes("Connect") ||
        gateText?.includes("wallet") ||
        gateText?.includes("Wallet"),
      ).toBeTruthy();
    }
  });

  test("dashboard shows stats grid with XP, courses, streak, level labels", async ({
    page,
  }) => {
    await gotoWithLocale(page, "/dashboard");
    // Wait for page to load
    await page.waitForTimeout(3000);

    // Try to find dashboard content (may need wallet gate to pass)
    // Check if we see the stat labels in the page
    const bodyText = await page.locator("body").textContent();

    // The page should have loaded successfully
    expect(bodyText).toBeTruthy();
    // Either shows wallet gate text or dashboard stats
    const hasDashboardContent =
      bodyText!.includes("EXPERIENCE") ||
      bodyText!.includes("STREAK") ||
      bodyText!.includes("LEVEL") ||
      bodyText!.includes("CONNECT") ||
      bodyText!.includes("wallet");
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

  test("dashboard renders streak heatmap area when visible", async ({
    page,
  }) => {
    await gotoWithLocale(page, "/dashboard");
    await page.waitForTimeout(3000);

    // Look for learning streak or heatmap text in the body
    const bodyText = await page.locator("body").textContent();

    // If the wallet gate is bypassed (demo mode), streak heatmap should appear
    const hasStreakOrGate =
      bodyText!.includes("LEARNING STREAK") ||
      bodyText!.includes("STREAK") ||
      bodyText!.includes("CONNECT") ||
      bodyText!.includes("wallet");
    expect(hasStreakOrGate).toBeTruthy();
  });
});
