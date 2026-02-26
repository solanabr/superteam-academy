import { test, expect } from "@playwright/test";

// Auth provider has a 5s safety timeout; CI machines are slow.
const AUTH_TIMEOUT = 20_000;
const PAGE_TIMEOUT = 15_000;

test.describe("Homepage", () => {
  test("renders title and navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Superteam Academy/, { timeout: PAGE_TIMEOUT });
    await expect(page.locator("nav")).toBeVisible({ timeout: PAGE_TIMEOUT });
  });

  test("has explore courses link", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // The link may be inside a hamburger on mobile — check any courses link exists in DOM
    const coursesLink = page.locator('a[href="/courses"]').first();
    await expect(coursesLink).toBeAttached({ timeout: PAGE_TIMEOUT });
  });
});

test.describe("Courses page", () => {
  test("loads course listing", async ({ page }) => {
    await page.goto("/courses", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Courses|Superteam Academy/, { timeout: PAGE_TIMEOUT });
  });
});

test.describe("Auth flow", () => {
  test("shows sign-in dialog when accessing protected route", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    // Wait for auth to resolve (5s safety timeout) then check for sign-in heading
    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible({ timeout: AUTH_TIMEOUT });
  });
});

test.describe("Settings page", () => {
  test("redirects unauthenticated users", async ({ page }) => {
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible({ timeout: AUTH_TIMEOUT });
  });
});

test.describe("Community page", () => {
  test("loads forum page", async ({ page }) => {
    await page.goto("/community", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Community|Superteam Academy/, { timeout: PAGE_TIMEOUT });
  });
});

test.describe("PWA", () => {
  test("serves manifest.json", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
    const body = await response?.json();
    expect(body.name).toBe("Superteam Academy");
  });

  test("serves service worker", async ({ page }) => {
    const response = await page.goto("/sw.js");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Offline page", () => {
  test("renders offline fallback", async ({ page }) => {
    await page.goto("/offline", { waitUntil: "domcontentloaded" });
    // Page shows "You're online!" when connected or "You're offline" when not
    await expect(
      page.getByRole("heading", { name: /you.re (offline|online)/i }),
    ).toBeVisible({ timeout: PAGE_TIMEOUT });
  });
});
