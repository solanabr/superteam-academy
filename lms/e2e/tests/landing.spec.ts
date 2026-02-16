import { test, expect } from "../fixtures/base";
import { LandingPage } from "../pages/landing.page";

test.describe("Landing page", () => {
  test("loads and shows hero section", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(page).toHaveTitle(/superteam|academy/i);
    await expect(landing.hero).toBeVisible();
  });

  test("has navigation links", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    await expect(landing.navLinks.first()).toBeVisible();
  });

  test("CTA button links to courses", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    const cta = page.getByRole("link", { name: /courses|start|explore|begin/i }).first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute("href");
    expect(href).toMatch(/course/i);
  });

  test("feature cards are rendered", async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();

    const cards = landing.featureCards;
    expect(await cards.count()).toBeGreaterThan(0);
  });
});
