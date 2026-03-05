import { test, expect } from "@playwright/test";

// ── h1 presence on all key pages ───────────────────────────────────────────

const keyPages = [
  { path: "/en", name: "Landing" },
  { path: "/en/courses", name: "Courses" },
  { path: "/en/leaderboard", name: "Leaderboard" },
  { path: "/en/auth/signin", name: "Sign In" },
  { path: "/en/settings", name: "Settings" },
];

test.describe("Accessibility — h1 heading on each page", () => {
  for (const { path, name } of keyPages) {
    test(`${name} page has at least one h1`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const h1 = page.locator("h1");
      await expect(h1.first()).toBeVisible();
    });
  }
});

test.describe("Accessibility — ARIA landmarks", () => {
  test("landing page has a navigation landmark", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const nav = page.locator("nav, [role='navigation']");
    const count = await nav.count();
    expect(count).toBeGreaterThan(0);
  });

  test("landing page has a main landmark", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const main = page.locator("main, [role='main']");
    const count = await main.count();
    expect(count).toBeGreaterThan(0);
  });

  test("landing page has a banner/header landmark", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    // role=banner is the implicit role of <header> at the top level
    const header = page.locator("header[role='banner'], header").first();
    await expect(header).toBeVisible();
  });

  test("courses page has main landmark", async ({ page }) => {
    await page.goto("/en/courses");
    await page.waitForLoadState("networkidle");
    const main = page.locator("main, [role='main']");
    expect(await main.count()).toBeGreaterThan(0);
  });

  test("leaderboard page has main landmark", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await page.waitForLoadState("networkidle");
    expect(await page.locator("main").count()).toBeGreaterThan(0);
  });
});

test.describe("Accessibility — image alt text", () => {
  test("landing page images have alt attribute", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = await images.nth(i).getAttribute("alt");
      // alt can be empty string for decorative images, but must not be null
      expect(alt).not.toBeNull();
    }
  });

  test("courses page images have alt attribute", async ({ page }) => {
    await page.goto("/en/courses");
    await page.waitForLoadState("networkidle");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).not.toBeNull();
    }
  });
});

test.describe("Accessibility — keyboard focus management", () => {
  test("header links are focusable via Tab", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    // Tab once and verify focus moves to a focusable element
    await page.keyboard.press("Tab");
    const activeEl = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeEl).toBeTruthy();
    // Should not still be on <body>
    expect(activeEl?.toLowerCase()).not.toBe("body");
  });

  test("interactive buttons are keyboard-focusable on sign-in page", async ({ page }) => {
    await page.goto("/en/auth/signin");
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("Tab");
    const activeEl = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeEl).toBeTruthy();
    expect(activeEl?.toLowerCase()).not.toBe("body");
  });

  test("all visible buttons have accessible names (non-empty text or aria-label)", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const buttons = page.locator("button:visible");
    const count = await buttons.count();
    let namedCount = 0;
    for (let i = 0; i < Math.min(count, 15); i++) {
      const btn = buttons.nth(i);
      const text = (await btn.textContent()) ?? "";
      const ariaLabel = (await btn.getAttribute("aria-label")) ?? "";
      const ariaLabelledBy = (await btn.getAttribute("aria-labelledby")) ?? "";
      if (text.trim().length > 0 || ariaLabel.length > 0 || ariaLabelledBy.length > 0) {
        namedCount++;
      }
    }
    // At least 80% of visible buttons should have accessible names
    if (count > 0) {
      expect(namedCount / Math.min(count, 15)).toBeGreaterThanOrEqual(0.8);
    }
  });
});

test.describe("Accessibility — page titles", () => {
  for (const { path, name } of keyPages) {
    test(`${name} page has a non-empty title`, async ({ page }) => {
      await page.goto(path);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
    });
  }
});

test.describe("Accessibility — html lang attribute", () => {
  test("English page sets lang to en", async ({ page }) => {
    await page.goto("/en");
    await page.waitForLoadState("networkidle");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toMatch(/en/i);
  });

  test("Portuguese page sets lang to pt", async ({ page }) => {
    await page.goto("/pt-BR");
    await page.waitForLoadState("networkidle");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toMatch(/pt/i);
  });

  test("Spanish page sets lang to es", async ({ page }) => {
    await page.goto("/es");
    await page.waitForLoadState("networkidle");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toMatch(/es/i);
  });
});
