import { test, expect } from "@playwright/test";

test.describe("SEO & Meta Tags", () => {
  test("landing page has title", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(2000);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("landing page has meta description", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(2000);
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    if (desc) {
      expect(desc.length).toBeGreaterThan(10);
    }
  });

  test("landing page has OG tags", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(2000);
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    if (ogTitle) {
      expect(ogTitle.length).toBeGreaterThan(0);
    }
  });

  test("viewport meta tag is set", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(1000);
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toContain("width");
  });

  test("html lang attribute matches locale", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(1000);
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBe("en");

    await page.goto("/pt-BR");
    await page.waitForTimeout(1000);
    const langPt = await page.locator("html").getAttribute("lang");
    expect(langPt).toBe("pt-BR");
  });
});
