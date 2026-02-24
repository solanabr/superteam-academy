import { test, expect } from "@playwright/test";

test.describe("Error & Not Found Pages", () => {
  test("unmatched route returns 404 status", async ({ page }) => {
    const response = await page.goto("/en/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("404 page renders content", async ({ page }) => {
    await page.goto("/en/this-route-does-not-exist");
    // Default Next.js 404 renders some content
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    const text = await page.textContent("body");
    expect(text!.length).toBeGreaterThan(0);
  });

  test("404 works in Portuguese locale", async ({ page }) => {
    const response = await page.goto("/pt-BR/does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("404 works in Spanish locale", async ({ page }) => {
    const response = await page.goto("/es/does-not-exist");
    expect(response?.status()).toBe(404);
  });
});
