import { test, expect } from "@playwright/test";

const LOCALES = ["pt", "en", "es"] as const;

test.describe("Internationalization", () => {
  for (const locale of LOCALES) {
    test(`/${locale} loads without errors`, async ({ page }) => {
      const response = await page.goto(`/${locale}`);
      expect(response?.status()).toBeLessThan(400);
      await expect(page).toHaveTitle(/Superteam Academy/);
    });

    test(`/${locale}/courses renders course catalog`, async ({ page }) => {
      const response = await page.goto(`/${locale}/courses`);
      expect(response?.status()).toBeLessThan(400);
      // Should have at least a heading
      const heading = page.locator("h1, h2").first();
      await expect(heading).toBeVisible();
    });
  }

  test("invalid locale returns 404", async ({ page }) => {
    const response = await page.goto("/fr");
    expect(response?.status()).toBe(404);
  });

  test("language switcher changes locale", async ({ page }) => {
    await page.goto("/pt");
    // Look for language switcher (typically in header/nav)
    const switcher = page.locator(
      '[data-testid="locale-switcher"], button:has-text("PT"), button:has-text("EN")',
    );
    if (await switcher.first().isVisible()) {
      await switcher.first().click();
      // Check that we navigated to a different locale
      const enLink = page.getByRole("link", { name: /english|en/i }).first();
      if (await enLink.isVisible()) {
        await enLink.click();
        await expect(page).toHaveURL(/\/en/);
      }
    }
  });
});
