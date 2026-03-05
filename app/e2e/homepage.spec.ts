import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("redirects root to /pt", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/pt$/);
  });

  test("renders hero section", async ({ page }) => {
    await page.goto("/pt");
    await expect(page).toHaveTitle(/Superteam Academy/);
    // Hero CTA buttons
    await expect(
      page.getByRole("link", { name: /cursos|courses/i }).first(),
    ).toBeVisible();
  });

  test("renders learning paths section", async ({ page }) => {
    await page.goto("/pt");
    // Learning paths section should be present
    const section = page.locator("text=Trilhas");
    await expect(section.first()).toBeVisible();
  });

  test("renders partners section", async ({ page }) => {
    await page.goto("/pt");
    const partners = page.locator('img[alt*="Solana"], img[alt*="solana"]');
    await expect(partners.first()).toBeVisible();
  });

  test("footer is visible", async ({ page }) => {
    await page.goto("/pt");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});
