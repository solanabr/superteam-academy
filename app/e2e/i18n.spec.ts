import { test, expect } from "@playwright/test";

test.describe("Internationalization", () => {
  test("English locale renders English content", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/On-Chain/);
    await expect(page.locator("text=Explore Courses").first()).toBeVisible();
  });

  test("Portuguese locale renders Portuguese content", async ({ page }) => {
    await page.goto("/pt-BR");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    // PT-BR landing has translated content
    await expect(page.locator("text=Explorar Cursos").first()).toBeVisible();
  });

  test("Spanish locale renders Spanish content", async ({ page }) => {
    await page.goto("/es");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Explorar Cursos").first()).toBeVisible();
  });

  test("language switcher navigates to correct locale", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toContainText("Settings", { timeout: 15000 });

    await page.locator("button").filter({ hasText: "Português" }).first().click();
    await page.waitForURL(/\/pt-BR\//, { timeout: 10000 });
    expect(page.url()).toContain("/pt-BR/");
    await expect(page.locator("h1")).toContainText("Configurações");
  });

  test("settings page localizes in Portuguese", async ({ page }) => {
    await page.goto("/pt-BR/settings");
    await expect(page.locator("h1")).toContainText("Configurações", { timeout: 15000 });
  });

  test("settings page localizes in Spanish", async ({ page }) => {
    await page.goto("/es/settings");
    await expect(page.locator("h1")).toContainText("Configuración", { timeout: 15000 });
  });

  test("html lang attribute matches locale", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en", { timeout: 10000 });

    await page.goto("/pt-BR");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR", { timeout: 10000 });

    await page.goto("/es");
    await expect(page.locator("html")).toHaveAttribute("lang", "es", { timeout: 10000 });
  });
});
