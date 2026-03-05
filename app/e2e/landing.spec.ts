import { test, expect } from "@playwright/test";

test.describe("Landing page — hero", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("domcontentloaded");
  });

  test("page title contains Superteam Academy", async ({ page }) => {
    await expect(page).toHaveTitle(/Superteam Academy/i);
  });

  test("h1 heading is visible and non-empty", async ({ page }) => {
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test("primary CTA button is visible and enabled", async ({ page }) => {
    const cta = page
      .getByRole("button", { name: /start learning|start now|get started|começar|começe/i })
      .or(page.getByRole("link", { name: /start learning|start now|get started|começar|começe/i }))
      .first();
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  });

  test("link to /courses exists in hero area", async ({ page }) => {
    const courseLink = page.locator("a[href*='/courses']").first();
    await expect(courseLink).toBeVisible();
  });

  test("header is visible", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });

  test("footer is visible", async ({ page }) => {
    await expect(page.locator("footer")).toBeVisible();
  });

  test("footer contains brand name", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/Superteam/i);
  });
});

test.describe("Landing page — sections", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("domcontentloaded");
  });

  test("stats section contains at least one number", async ({ page }) => {
    // Stats counters are common numeric content on the landing page
    const bodyText = await page.locator("main").textContent();
    expect(bodyText).toMatch(/\d+/);
  });

  test("page has multiple sections with headings", async ({ page }) => {
    const headings = page.locator("h1, h2, h3");
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("Solana is mentioned on the landing page", async ({ page }) => {
    const solanaText = page.getByText(/Solana/i).first();
    await expect(solanaText).toBeVisible();
  });

  test("page renders without unhandled runtime error", async ({ page }) => {
    const errorOverlay = page.getByText(/unhandled runtime error/i);
    await expect(errorOverlay).toHaveCount(0);
  });

  test("at least one SVG element renders (SolanaOrb or logo)", async ({ page }) => {
    const svgCount = await page.locator("svg").count();
    expect(svgCount).toBeGreaterThan(0);
  });

  test("main content area is visible", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Landing page — pt-BR locale", () => {
  test("pt-BR landing page loads with correct title", async ({ page }) => {
    await page.goto("/pt-BR");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveTitle(/Superteam Academy/i);
  });

  test("pt-BR landing page has h1", async ({ page }) => {
    await page.goto("/pt-BR");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("Landing page — footer links", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("domcontentloaded");
  });

  test("footer has at least one link", async ({ page }) => {
    const footerLinks = page.locator("footer a");
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("footer content is non-empty", async ({ page }) => {
    const footer = page.locator("footer");
    const text = await footer.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });
});
