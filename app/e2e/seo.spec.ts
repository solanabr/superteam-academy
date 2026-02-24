import { test, expect } from "@playwright/test";

test.describe("SEO & Meta Tags", () => {
  test("landing page has descriptive title", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const title = await page.title();
    expect(title).toContain("Superteam Academy");
  });

  test("landing page has meta description", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(30);
  });

  test("landing page has OpenGraph tags", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).toBeTruthy();
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute("content");
    expect(ogDesc).toBeTruthy();
  });

  test("viewport meta tag is properly configured", async ({ page }) => {
    await page.goto("/en");
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toContain("width=device-width");
  });

  test("html lang attribute matches locale", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en", { timeout: 10000 });
    await page.goto("/pt-BR");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR", { timeout: 10000 });
  });

  test("robots.txt is accessible", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
    const text = await page.textContent("body");
    expect(text).toContain("User-Agent");
    expect(text).toContain("Sitemap");
  });

  test("sitemap.xml is accessible", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
    const text = await page.textContent("body");
    expect(text).toContain("urlset");
  });

  test("PWA manifest is linked", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    const manifest = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(manifest).toContain("manifest");
  });

  test("manifest.json is accessible and valid", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
    const text = await page.textContent("body");
    const json = JSON.parse(text!);
    expect(json.name).toBe("Superteam Academy");
    expect(json.display).toBe("standalone");
    expect(json.icons.length).toBeGreaterThanOrEqual(2);
  });
});
