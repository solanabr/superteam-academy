import { test, expect } from "@playwright/test";

test.describe("Internationalization", () => {
  test("English landing page shows English content", async ({ page }) => {
    await page.goto("/en");
    // Hero renders heroHeadline ("Learn") + heroOnChain ("on-chain.")
    await expect(page.getByText("Learn").first()).toBeVisible();
    await expect(page.getByText("on-chain.").first()).toBeVisible();
    await expect(page.getByText("Explore Courses")).toBeVisible();
  });

  test("Spanish landing page shows Spanish content", async ({ page }) => {
    await page.goto("/es");
    // Hero renders heroHeadline ("Aprende") + heroOnChain ("on-chain.")
    await expect(page.getByText("Aprende").first()).toBeVisible();
    await expect(page.getByText("Explorar Cursos")).toBeVisible();
  });

  test("Portuguese landing page shows Portuguese content", async ({ page }) => {
    await page.goto("/pt-br");
    // Hero renders heroHeadline ("Aprenda") + heroOnChain ("on-chain.")
    await expect(page.getByText("Aprenda").first()).toBeVisible();
    await expect(page.getByText("Explorar Cursos")).toBeVisible();
  });

  test("navigation labels change per locale", async ({ page }) => {
    // English nav
    await page.goto("/en");
    await expect(
      page.getByRole("link", { name: "Courses" }).first(),
    ).toBeVisible();

    // Spanish nav
    await page.goto("/es");
    await expect(
      page.getByRole("link", { name: "Cursos" }).first(),
    ).toBeVisible();

    // Portuguese nav
    await page.goto("/pt-br");
    await expect(
      page.getByRole("link", { name: "Cursos" }).first(),
    ).toBeVisible();
  });

  test("settings page language links navigate between locales", async ({
    page,
  }) => {
    await page.goto("/en/settings");
    // The language selector should show all three locale options
    await expect(page.getByRole("link", { name: "English" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Portugu[eê]s/ }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Espa[nñ]ol/ })).toBeVisible();
  });

  test("switching locale from settings navigates to the new locale", async ({
    page,
  }) => {
    await page.goto("/en/settings");
    // Click the Spanish locale link
    await page
      .getByRole("link", { name: /Espa[nñ]ol/ })
      .click({ timeout: 15_000 });
    await page.waitForURL("**/es/settings", { timeout: 15_000 });
    // Settings heading should now be in Spanish
    await expect(page.getByRole("heading", { name: /Ajustes/i })).toBeVisible();
  });

  test("html lang attribute matches the locale", async ({ page }) => {
    await page.goto("/en");
    // The locale layout sets document.documentElement.lang
    await expect(page.locator("html")).toHaveAttribute("lang", "en", {
      timeout: 5_000,
    });

    await page.goto("/pt-br");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR", {
      timeout: 5_000,
    });

    await page.goto("/es");
    await expect(page.locator("html")).toHaveAttribute("lang", "es", {
      timeout: 5_000,
    });
  });
});
