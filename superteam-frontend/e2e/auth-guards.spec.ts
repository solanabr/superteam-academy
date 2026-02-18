import { test, expect } from "@playwright/test";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/courses",
  "/leaderboard",
  "/profile",
  "/settings",
  "/admin",
];

test.describe("Auth guards", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects unauthenticated users to /`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/(\/|\/auth\/signin)/, { timeout: 10_000 });
      const url = new URL(page.url());
      expect(url.pathname === "/" || url.pathname === "/auth/signin").toBe(true);
    });
  }
});
