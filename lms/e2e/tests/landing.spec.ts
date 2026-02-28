import { test, expect } from "../fixtures/base";
import { LandingPage } from "../pages/landing.page";

test.describe("Landing page", () => {
  test("loads and shows hero section", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await page.waitForLoadState("domcontentloaded");

    // Title is "Learn Solana Development"
    await expect(page).toHaveTitle(/solana/i);
    // Hero section contains the heading
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("has navigation links", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("nav").first()).toBeVisible();
  });

  test("CTA button links to courses", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await page.waitForLoadState("domcontentloaded");

    // "Start Learning" button links to /courses
    const cta = page.getByRole("link", { name: /start learning/i }).first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute("href");
    expect(href).toMatch(/course/i);
  });

  test("feature cards are rendered", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await page.waitForLoadState("domcontentloaded");

    // Landing page has multiple sections with h2 headings
    const headings = page.locator("h2");
    expect(await headings.count()).toBeGreaterThan(0);
  });
});
