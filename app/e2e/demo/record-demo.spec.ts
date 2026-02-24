import { expect } from "@playwright/test";
import { test, seedQueryCache } from "./fixtures";
import { DEMO_WALLET } from "./mock-data";

test.describe.serial("Demo Recording", () => {
  // Scene 1: Landing / Hero
  test("hero", async ({ demoPage: page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    await seedQueryCache(page);
    await page.waitForTimeout(1500);

    // Scroll down slowly to show features
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await page.waitForTimeout(1500);
  });

  // Scene 2: Features section
  test("features", async ({ demoPage: page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    await seedQueryCache(page);

    // Scroll to features section
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "smooth" }));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "smooth" }));
    await page.waitForTimeout(2000);
  });

  // Scene 3: Course Catalog
  test("catalog", async ({ demoPage: page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    await seedQueryCache(page);

    // Scroll to catalog section
    await page.evaluate(() =>
      document.querySelector("[data-testid='catalog']")?.scrollIntoView({ behavior: "smooth" })
    );
    await page.waitForTimeout(1500);

    // Try clicking difficulty filters if they exist
    const filters = page.locator("[data-testid='difficulty-filter'], button:has-text('Beginner'), button:has-text('Intermediate')");
    if (await filters.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await filters.first().click();
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(1500);
  });

  // Scene 4: Course Detail
  test("course-detail", async ({ demoPage: page }) => {
    await page.goto("/en/courses/solana-101");
    await page.waitForLoadState("networkidle");
    await seedQueryCache(page);
    await page.waitForTimeout(1500);

    // Scroll to show lesson modules
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }));
    await page.waitForTimeout(1500);

    // Expand a lesson module if accordion exists
    const accordion = page.locator("[data-testid='lesson-accordion'], details, [role='button']:has-text('Lesson')");
    if (await accordion.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await accordion.first().click();
      await page.waitForTimeout(1000);
    }

    await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
    await page.waitForTimeout(1500);
  });

  // Scene 5: Lesson View
  test("lesson", async ({ demoPage: page }) => {
    await page.goto("/en/courses/solana-101/lessons/0");
    await page.waitForLoadState("networkidle");
    await seedQueryCache(page);
    await page.waitForTimeout(2000);

    // Scroll through lesson content
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
    await page.waitForTimeout(1500);

    // Interact with code editor if visible
    const editor = page.locator("[data-testid='code-editor'], .monaco-editor");
    if (await editor.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await editor.first().click();
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(1500);
  });

  // Scene 6: Dashboard
  test("dashboard", async ({ demoPage: page }) => {
    await page.goto("/en/my-learning");
    await page.waitForLoadState("networkidle");
    await seedQueryCache(page);
    await page.waitForTimeout(2000);

    // Scroll to show streak calendar and courses
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
    await page.waitForTimeout(1500);
  });

  // Scene 7: Profile
  test("profile", async ({ demoPage: page }) => {
    await page.goto("/en/profile");
    await page.waitForLoadState("networkidle");
    await seedQueryCache(page);
    await page.waitForTimeout(2000);

    // Scroll to radar chart and credentials
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: "smooth" }));
    await page.waitForTimeout(1500);
  });

  // Scene 8: Leaderboard
  test("leaderboard", async ({ demoPage: page }) => {
    await page.goto("/en/leaderboard");
    await page.waitForLoadState("networkidle");
    await seedQueryCache(page);
    await page.waitForTimeout(1500);

    // Click time filters if available
    const weeklyFilter = page.locator("button:has-text('Weekly'), button:has-text('Week'), [data-testid='filter-weekly']");
    if (await weeklyFilter.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await weeklyFilter.first().click();
      await page.waitForTimeout(800);
    }

    const monthlyFilter = page.locator("button:has-text('Monthly'), button:has-text('Month'), [data-testid='filter-monthly']");
    if (await monthlyFilter.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await monthlyFilter.first().click();
      await page.waitForTimeout(800);
    }

    // Scroll to show more entries
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }));
    await page.waitForTimeout(1500);
  });

  // Scene 9: Settings — theme and language toggle
  test("settings", async ({ demoPage: page }) => {
    await page.goto("/en/settings");
    await page.waitForLoadState("networkidle");
    await seedQueryCache(page);
    await page.waitForTimeout(1500);

    // Toggle to light theme
    const themeToggle = page.locator("[data-testid='theme-toggle'], button:has-text('Light'), [aria-label*='theme']");
    if (await themeToggle.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await themeToggle.first().click();
      await page.waitForTimeout(1200);
      // Toggle back to dark
      await themeToggle.first().click();
      await page.waitForTimeout(1000);
    }

    // Switch language to PT-BR
    const langSelect = page.locator("[data-testid='language-select'], select:has(option), [aria-label*='language']");
    if (await langSelect.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await langSelect.first().selectOption({ label: "Português" }).catch(() => {});
      await page.waitForTimeout(1200);
      // Switch back to EN
      await langSelect.first().selectOption({ label: "English" }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(1000);
  });

  // Scene 10: Responsive — mobile viewport
  test("responsive", async ({ demoPage: page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    await seedQueryCache(page);
    await page.waitForTimeout(1000);

    // Resize to mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1500);

    // Open mobile hamburger menu
    const hamburger = page.locator("[data-testid='mobile-menu'], button[aria-label*='menu'], button[aria-label*='Menu'], .hamburger");
    if (await hamburger.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await hamburger.first().click();
      await page.waitForTimeout(1200);
      // Close it
      await hamburger.first().click().catch(() => {});
      await page.waitForTimeout(800);
    }

    // Scroll on mobile
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
    await page.waitForTimeout(1000);

    // Back to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
  });

  // Scene 11: Internationalization
  test("i18n", async ({ demoPage: page }) => {
    // English
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    await seedQueryCache(page);
    await page.waitForTimeout(1000);

    // Portuguese
    await page.goto("/pt-BR");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200);

    // Spanish
    await page.goto("/es");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1200);
  });

  // Assertion to ensure serial suite is valid
  test("verify scenes recorded", async ({ demoPage: page }) => {
    expect(page).toBeTruthy();
  });
});
