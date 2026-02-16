import { test, expect } from "../fixtures/base";

test.describe("Locale switching", () => {
  test("default locale (en) has no URL prefix", async ({ page }) => {
    await page.goto("/");
    expect(page.url()).not.toMatch(/\/(en)\//);
  });

  test("/es/ shows Spanish locale", async ({ page }) => {
    await page.goto("/es");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
  });

  test("/pt-BR/ shows Portuguese locale", async ({ page }) => {
    await page.goto("/pt-BR");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  });

  test("html lang attribute matches locale for Hindi", async ({ page }) => {
    await page.goto("/hi");
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  });

  test("non-default locale pages load without error", async ({ page }) => {
    const response = await page.goto("/es");
    expect(response?.status()).toBeLessThan(500);

    const response2 = await page.goto("/pt-BR");
    expect(response2?.status()).toBeLessThan(500);
  });
});
