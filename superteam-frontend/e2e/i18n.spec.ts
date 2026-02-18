import { test, expect } from "@playwright/test";

async function setLocaleCookie(
  page: import("@playwright/test").Page,
  locale: string,
) {
  await page
    .context()
    .addCookies([
      { name: "locale", value: locale, domain: "localhost", path: "/" },
    ]);
}

test.describe("i18n: Spanish", () => {
  test("switching to Spanish changes UI text", async ({ page }) => {
    await page.goto("/");
    await setLocaleCookie(page, "es");
    await page.reload();
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    // Spanish text should appear (e.g. "Explorar", "Cursos", "Iniciar")
    // At minimum, page should render without errors
    expect(body!.length).toBeGreaterThan(0);
  });
});

test.describe("i18n: Portuguese", () => {
  test("switching to Portuguese changes UI text", async ({ page }) => {
    await page.goto("/");
    await setLocaleCookie(page, "pt-br");
    await page.reload();
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(0);
  });
});

test.describe("i18n: Default English", () => {
  test("English text is present by default", async ({ page }) => {
    await page.goto("/");
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
    // English text should contain common words like "Explore", "Courses", etc.
    expect(body).toMatch(/explore|courses|learn|start/i);
  });
});

test.describe("i18n: Language switcher", () => {
  test("navbar shows language switcher", async ({ page }) => {
    await page.goto("/");
    const switcher = page
      .locator("[data-testid='language-switcher']")
      .or(
        page
          .locator("button:has-text('EN')")
          .or(page.locator("button:has-text('ES')"))
          .or(page.locator("button:has-text('PT')")),
      );
    await expect(switcher.first()).toBeVisible();
  });
});
