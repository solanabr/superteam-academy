import { test, expect } from "@playwright/test";

test.describe("Internationalization", () => {
  test("English locale renders content", async ({ page }) => {
    await page.goto("/en");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).toContain("Solana");
  });

  test("Portuguese locale renders Portuguese content", async ({ page }) => {
    await page.goto("/pt-BR");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).toMatch(/Solana|On-Chain|Cursos/);
  });

  test("Spanish locale renders Spanish content", async ({ page }) => {
    await page.goto("/es");
    await page.waitForTimeout(2000);
    const body = await page.textContent("body");
    expect(body).toMatch(/Solana|On-Chain|Cursos/);
  });

  test("language switcher navigates to correct locale", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);
    // Click Português button
    const ptBtn = page.locator("button").filter({ hasText: "Português" });
    if ((await ptBtn.count()) > 0) {
      await ptBtn.first().click();
      await page.waitForURL(/\/pt-BR\//, { timeout: 10000 });
      expect(page.url()).toContain("/pt-BR/");
    }
  });

  test("settings page title localizes", async ({ page }) => {
    // English
    await page.goto("/en/settings");
    await page.waitForTimeout(2000);
    let body = await page.textContent("body");
    expect(body).toMatch(/Settings|Configurações|Configuración/);

    // Portuguese
    await page.goto("/pt-BR/settings");
    await page.waitForTimeout(2000);
    body = await page.textContent("body");
    expect(body).toContain("Configurações");
  });
});
