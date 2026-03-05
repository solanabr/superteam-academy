/**
 * Smoke tests — fast, broad checks that every major page is up.
 * These run first to catch catastrophic failures.
 * Deeper coverage lives in the dedicated spec files.
 */
import { test, expect } from "@playwright/test";

const criticalRoutes = [
  { path: "/en", name: "Home (en)" },
  { path: "/pt-BR", name: "Home (pt-BR)" },
  { path: "/es", name: "Home (es)" },
  { path: "/en/courses", name: "Courses" },
  { path: "/en/courses/introduction-to-solana", name: "Course detail" },
  { path: "/en/leaderboard", name: "Leaderboard" },
  { path: "/en/community", name: "Community" },
  { path: "/en/settings", name: "Settings" },
  { path: "/en/dashboard", name: "Dashboard" },
  { path: "/en/auth/signin", name: "Sign In" },
  { path: "/en/certificates", name: "Certificates" },
  { path: "/en/profile", name: "Profile" },
];

test.describe("Smoke — critical routes render without crash", () => {
  for (const { path, name } of criticalRoutes) {
    test(`${name} (${path}) loads`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");
      // Must render a body without an unhandled JS error overlay
      await expect(page.locator("body")).toBeVisible();
      const errorOverlay = page.getByText(/unhandled runtime error/i);
      await expect(errorOverlay).toHaveCount(0);
    });
  }
});

test.describe("Smoke — page titles", () => {
  for (const { path, name } of criticalRoutes) {
    test(`${name} has a non-empty page title`, async ({ page }) => {
      await page.goto(path);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
    });
  }
});

test.describe("Smoke — lesson page", () => {
  test("known lesson slug loads main content", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana/lessons/what-is-solana");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });
});

test.describe("Smoke — certificate routes", () => {
  test("certificates list page renders", async ({ page }) => {
    await page.goto("/en/certificates");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });

  test("invalid certificate ID renders gracefully", async ({ page }) => {
    await page.goto("/en/certificates/invalid-cert-id-000");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });
});
