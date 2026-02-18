import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero section with heading", async ({ page }) => {
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("renders CTA buttons", async ({ page }) => {
    const cta = page
      .locator("a, button")
      .filter({ hasText: /explore|sign|start|get started/i });
    expect(await cta.count()).toBeGreaterThan(0);
  });

  test("renders stats section with numbers", async ({ page }) => {
    const stat = page.locator("text=/\\d+[kK+]?/").first();
    await expect(stat).toBeVisible();
  });

  test("renders feature cards", async ({ page }) => {
    const cards = page.locator("[class*='card'], [class*='Card']");
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test("renders footer", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.locator("a").first()).toBeVisible();
  });
});

test.describe("Roadmaps", () => {
  test("roadmaps list renders with cards", async ({ page }) => {
    await page.goto("/roadmaps");
    await expect(page.locator("h1")).toContainText(/roadmap/i);
    const cards = page.locator("[class*='card'], [class*='Card']");
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
  });

  test("individual roadmap page loads", async ({ page }) => {
    await page.goto("/roadmaps/solana-developer");
    await page.waitForLoadState("networkidle");
    // Roadmap content should render (dynamic import)
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Sign-in page", () => {
  test("shows wallet connect option", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.locator("text=Sign in").first()).toBeVisible();
    await expect(
      page.locator("text=/connect wallet|wallet/i").first(),
    ).toBeVisible();
  });
});
