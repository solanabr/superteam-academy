import { test, expect } from "./fixtures/auth";
import { test as publicTest, expect as publicExpect } from "@playwright/test";

type NavTiming = {
  domContentLoadedEventEnd: number;
  loadEventEnd: number;
  startTime: number;
};

async function getNavTiming(
  page: import("@playwright/test").Page,
): Promise<NavTiming> {
  return page.evaluate(() => {
    const [entry] = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];
    return {
      domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
      loadEventEnd: entry.loadEventEnd,
      startTime: entry.startTime,
    };
  });
}

publicTest.describe("Performance: Public pages", () => {
  publicTest("landing page DOMContentLoaded < 3s", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const timing = await getNavTiming(page);
    const dcl = timing.domContentLoadedEventEnd - timing.startTime;
    publicExpect(dcl).toBeLessThan(3000);
  });

  publicTest("landing page full load < 5s", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const timing = await getNavTiming(page);
    const load = timing.loadEventEnd - timing.startTime;
    publicExpect(load).toBeLessThan(5000);
  });
});

test.describe("Performance: Authenticated pages", () => {
  test("courses page load < 6s", async ({ authenticatedPage: page }) => {
    await page.goto("/courses", { waitUntil: "load", timeout: 10_000 });
    const timing = await getNavTiming(page);
    const load = timing.loadEventEnd - timing.startTime;
    expect(load).toBeLessThan(6000);
  });

  test("dashboard page load < 6s", async ({ authenticatedPage: page }) => {
    await page.goto("/dashboard", { waitUntil: "load", timeout: 10_000 });
    const timing = await getNavTiming(page);
    const load = timing.loadEventEnd - timing.startTime;
    expect(load).toBeLessThan(6000);
  });

  test("leaderboard page load < 5s", async ({ authenticatedPage: page }) => {
    await page.goto("/leaderboard", { waitUntil: "load", timeout: 10_000 });
    const timing = await getNavTiming(page);
    const load = timing.loadEventEnd - timing.startTime;
    expect(load).toBeLessThan(5000);
  });
});

publicTest.describe("Performance: Bundle size", () => {
  publicTest("total JS transferred < 500KB", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const totalJsBytes = await page.evaluate(() => {
      const resources = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      return resources
        .filter((r) => r.initiatorType === "script" || r.name.endsWith(".js"))
        .reduce((sum, r) => sum + r.transferSize, 0);
    });
    const totalJsKB = totalJsBytes / 1024;
    publicExpect(totalJsKB).toBeLessThan(500);
  });
});

test.describe("Performance: Loading skeletons", () => {
  test("courses page shows content without blank screen", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/courses");
    // Either skeleton or final content should be visible quickly
    const content = page
      .locator("[class*='skeleton'], [class*='animate-pulse'], main h1")
      .first();
    await expect(content).toBeVisible({ timeout: 5_000 });
  });

  test("dashboard shows content without blank screen", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/dashboard");
    const content = page
      .locator("[class*='skeleton'], [class*='animate-pulse'], main")
      .first();
    await expect(content).toBeVisible({ timeout: 5_000 });
  });
});
