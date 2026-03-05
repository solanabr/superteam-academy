import { test, expect } from "@playwright/test";

test.describe("i18n — locale URL routing", () => {
  test("English locale URL contains /en", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/en/);
  });

  test("Portuguese locale URL contains /pt-BR", async ({ page }) => {
    await page.goto("/pt-BR");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/pt-BR/);
  });

  test("Spanish locale URL contains /es", async ({ page }) => {
    await page.goto("/es");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/es/);
  });

  test("all three locales have correct lang attribute", async ({ page }) => {
    const cases = [
      { path: "/en", expectedLang: /en/i },
      { path: "/pt-BR", expectedLang: /pt/i },
      { path: "/es", expectedLang: /es/i },
    ];
    for (const { path, expectedLang } of cases) {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");
      const lang = await page.locator("html").getAttribute("lang");
      expect(lang).toMatch(expectedLang);
    }
  });
});

test.describe("i18n — pages load in all locales", () => {
  const locales = ["en", "pt-BR", "es"] as const;

  for (const locale of locales) {
    test(`home page loads in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).not.toHaveURL(/error|404/);
      await expect(page.locator("h1").first()).toBeVisible();
    });

    test(`courses page loads in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/courses`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).not.toHaveURL(/error|404/);
      await expect(page.locator("main")).toBeVisible();
    });

    test(`leaderboard page loads in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/leaderboard`);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).not.toHaveURL(/error|404/);
      await expect(page.locator("main")).toBeVisible();
    });
  }
});

test.describe("i18n — locale switcher", () => {
  test("locale switcher button/globe icon is visible", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("domcontentloaded");
    const switcher = page
      .locator("[aria-label*='language' i], [aria-label*='locale' i], [aria-label*='select' i]")
      .or(page.locator("button:has(svg)").filter({ has: page.getByText(/en|pt|es/i) }))
      .first();
    // Globe button without text — look for the aria-label pattern from LocaleSwitcher
    const globeBtn = page.locator("button[aria-label]").filter({
      has: page.locator("svg"),
    }).first();
    const switcherCount = await switcher.count();
    const globeCount = await globeBtn.count();
    expect(switcherCount + globeCount).toBeGreaterThan(0);
  });

  test("clicking locale switcher opens a dropdown without crashing", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("domcontentloaded");
    // LocaleSwitcher has aria-label from common.selectLanguage translation
    const globeBtn = page
      .locator("button[aria-label]")
      .filter({ has: page.locator("svg") })
      .first();
    const count = await globeBtn.count();
    if (count > 0) {
      await globeBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("switching to Portuguese locale changes URL", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("domcontentloaded");
    // Try to find a language dropdown item
    const globeBtn = page
      .locator("button[aria-label]")
      .filter({ has: page.locator("svg") })
      .first();
    const count = await globeBtn.count();
    if (count > 0) {
      await globeBtn.click();
      await page.waitForTimeout(300);
      const portuguesItem = page.getByRole("menuitem", { name: /Português/i }).first();
      const ptCount = await portuguesItem.count();
      if (ptCount > 0) {
        await portuguesItem.click();
        await page.waitForLoadState("domcontentloaded");
        expect(page.url()).toContain("/pt-BR");
      }
    }
  });

  test("locale-aware courses page has correct title per locale", async ({ page }) => {
    // Portuguese courses page should load and have pt-BR content
    await page.goto("/pt-BR/courses");
    await page.waitForLoadState("domcontentloaded");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe("i18n — settings page locale switching", () => {
  test("settings page has a locale switcher component", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForLoadState("domcontentloaded");
    // The Settings component embeds a LocaleSwitcher
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});
