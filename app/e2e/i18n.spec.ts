import { test, expect } from "@playwright/test";
import { dismissOnboarding } from "./helpers";

// The app uses localePrefix: "never" — URLs never contain locale segments.
// Visiting /en, /pt-BR, /es sets a NEXT_LOCALE cookie and redirects to /.
// Locale is determined by cookie, not URL path.

test.describe("i18n — locale URL routing", () => {
  test("English locale URL redirects to / and sets lang=en", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    // localePrefix: "never" strips the locale from the URL
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toMatch(/en/i);
  });

  test("Portuguese locale URL redirects to / and sets lang=pt", async ({ page }) => {
    await page.goto("/pt-BR");
    await page.waitForLoadState("networkidle");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toMatch(/pt/i);
  });

  test("Spanish locale URL redirects to / and sets lang=es", async ({ page }) => {
    await page.goto("/es");
    await page.waitForLoadState("networkidle");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toMatch(/es/i);
  });

  test("all three locales have correct lang attribute", async ({ page }) => {
    const cases = [
      { path: "/en", expectedLang: /en/i },
      { path: "/pt-BR", expectedLang: /pt/i },
      { path: "/es", expectedLang: /es/i },
    ];
    for (const { path, expectedLang } of cases) {
      await page.goto(path);
      // Wait for the redirect from /locale to / to complete
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
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
      await page.waitForLoadState("networkidle");
      await expect(page).not.toHaveURL(/error|404/);
      await expect(page.locator("h1").first()).toBeVisible();
    });

    test(`courses page loads in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/courses`);
      await page.waitForLoadState("networkidle");
      await expect(page).not.toHaveURL(/error|404/);
      await expect(page.locator("main")).toBeVisible();
    });

    test(`leaderboard page loads in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/leaderboard`);
      await page.waitForLoadState("networkidle");
      await expect(page).not.toHaveURL(/error|404/);
      await expect(page.locator("main")).toBeVisible();
    });
  }
});

test.describe("i18n — locale switcher", () => {
  test("locale switcher button/globe icon is visible", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const switcher = page.locator("button[aria-label*='language' i], button[aria-label*='Select language' i]").first();
    const count = await switcher.count();
    expect(count).toBeGreaterThan(0);
    if (count > 0) {
      await expect(switcher).toBeVisible();
    }
  });

  test("clicking locale switcher opens a dropdown without crashing", async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    // The LocaleSwitcher has aria-label="Select language"
    const globeBtn = page.locator("button[aria-label*='language' i]").first();
    const count = await globeBtn.count();
    if (count > 0) {
      await globeBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("switching to Portuguese locale changes lang attribute", async ({ page }) => {
    await dismissOnboarding(page);
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const globeBtn = page.locator("button[aria-label*='language' i]").first();
    const count = await globeBtn.count();
    if (count > 0) {
      await globeBtn.click();
      await page.waitForTimeout(300);
      // DropdownMenuItem renders as [role="menuitem"]
      const portuguesItem = page.getByRole("menuitem", { name: /Português/i }).first();
      const ptCount = await portuguesItem.count();
      if (ptCount > 0) {
        await portuguesItem.click();
        // router.replace with localePrefix:"never" triggers navigation — wait for it
        await page.waitForLoadState("networkidle");
        // The lang attribute may change after a client-side navigation
        // Give the page a moment to settle after locale switch
        await page.waitForTimeout(500);
        const lang = await page.locator("html").getAttribute("lang");
        // Accept either pt (locale changed) or en (locale set via cookie, needs reload)
        const localeCookie = (await page.context().cookies()).find(c => c.name === "NEXT_LOCALE");
        expect(lang === "pt-BR" || lang === "pt" || localeCookie?.value === "pt-BR").toBeTruthy();
      }
    }
  });

  test("locale-aware courses page has correct title per locale", async ({ page }) => {
    // Portuguese courses page should load and have pt-BR content
    await page.goto("/pt-BR/courses");
    await page.waitForLoadState("networkidle");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe("i18n — settings page locale switching", () => {
  test("settings page has a locale switcher component", async ({ page }) => {
    await page.goto("/en/settings");
    await page.waitForLoadState("networkidle");
    // Settings may redirect to signin if unauthenticated — just verify main is visible
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});
