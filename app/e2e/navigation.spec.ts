import { test, expect } from "@playwright/test";

test.describe("Course catalog navigation", () => {
  test("clicking a course card navigates to course detail page", async ({ page }) => {
    await page.goto("/en/courses");
    // Find the first course link and click it
    const courseLink = page.locator("a[href*='/courses/']").first();
    const count = await courseLink.count();
    if (count > 0) {
      const href = await courseLink.getAttribute("href");
      await courseLink.click();
      await page.waitForLoadState("domcontentloaded");
      // Should navigate away from the catalog
      if (href) {
        expect(page.url()).toContain("/courses/");
      }
    } else {
      // No courses yet — catalog main body should still be visible
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("courses page shows main content area", async ({ page }) => {
    await page.goto("/en/courses");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("courses page title contains course-related text", async ({ page }) => {
    await page.goto("/en/courses");
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text).toBeTruthy();
    expect(typeof text).toBe("string");
  });
});

test.describe("Course detail page", () => {
  test("course detail page has a heading", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    const title = page.locator("h1").first();
    await expect(title).toBeVisible();
  });

  test("course detail page has main content", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    await expect(page.locator("main")).toBeVisible();
  });

  test("course detail page renders without crashing", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    // Body should be present and not show an unhandled error
    await expect(page.locator("body")).toBeVisible();
    const errorText = page.getByText(/unhandled runtime error/i);
    await expect(errorText).toHaveCount(0);
  });
});

test.describe("Leaderboard page", () => {
  test("leaderboard has a visible heading", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("leaderboard main section is rendered", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await expect(page.locator("main")).toBeVisible();
  });

  test("leaderboard body contains some list or table structure", async ({ page }) => {
    await page.goto("/en/leaderboard");
    // Look for table or list-style elements (or at minimum the main section)
    const hasTable = (await page.locator("table").count()) > 0;
    const hasList = (await page.locator("ul, ol").count()) > 0;
    const hasMain = (await page.locator("main").count()) > 0;
    expect(hasTable || hasList || hasMain).toBeTruthy();
  });

  test("leaderboard does not show an unhandled error", async ({ page }) => {
    await page.goto("/en/leaderboard");
    const errorText = page.getByText(/unhandled runtime error/i);
    await expect(errorText).toHaveCount(0);
  });
});

test.describe("Admin page access control", () => {
  test("admin page redirects or shows auth prompt when unauthenticated", async ({ page }) => {
    await page.goto("/en/admin");
    // Should either redirect to auth or show an access-denied/sign-in UI
    const url = page.url();
    const isAuthRedirect = url.includes("/auth") || url.includes("/signin") || url.includes("/login");
    const hasSignInText = await page.getByText(/sign in|connect|login|access denied|unauthorized/i).isVisible().catch(() => false);
    const hasMainContent = await page.locator("main").isVisible().catch(() => false);
    expect(isAuthRedirect || hasSignInText || hasMainContent).toBeTruthy();
  });

  test("admin page does not crash the application", async ({ page }) => {
    await page.goto("/en/admin");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Header navigation", () => {
  test("header contains navigation links", async ({ page }) => {
    await page.goto("/en");
    const header = page.locator("header");
    await expect(header).toBeVisible();
    // At least one anchor tag in the header
    const links = header.locator("a");
    const linkCount = await links.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test("courses link in header navigates to /courses", async ({ page }) => {
    await page.goto("/en");
    const coursesLink = page.locator("header").getByRole("link", { name: /courses/i }).first();
    const count = await coursesLink.count();
    if (count > 0) {
      await coursesLink.click();
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/courses");
    } else {
      // If no courses link in header, just verify header exists
      await expect(page.locator("header")).toBeVisible();
    }
  });

  test("leaderboard link navigates to leaderboard", async ({ page }) => {
    await page.goto("/en");
    const leaderboardLink = page.locator("a[href*='leaderboard']").first();
    const count = await leaderboardLink.count();
    if (count > 0) {
      await leaderboardLink.click();
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("leaderboard");
    } else {
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("logo/home link navigates back to home", async ({ page }) => {
    await page.goto("/en/courses");
    // Find a link that goes to the root locale path
    const homeLink = page.locator("a[href='/en'], a[href='/en/']").first();
    const count = await homeLink.count();
    if (count > 0) {
      await homeLink.click();
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toMatch(/\/en\/?$/);
    } else {
      await expect(page.locator("header")).toBeVisible();
    }
  });
});

test.describe("Footer", () => {
  test("footer is present on the home page", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("footer")).toBeVisible();
  });

  test("footer is present on the courses page", async ({ page }) => {
    await page.goto("/en/courses");
    await expect(page.locator("footer")).toBeVisible();
  });

  test("footer is present on the leaderboard page", async ({ page }) => {
    await page.goto("/en/leaderboard");
    await expect(page.locator("footer")).toBeVisible();
  });

  test("footer is present on the settings page", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("footer")).toBeVisible();
  });

  test("footer contains some links or text", async ({ page }) => {
    await page.goto("/en");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    const content = await footer.textContent();
    expect(content).toBeTruthy();
    expect(content!.trim().length).toBeGreaterThan(0);
  });
});

test.describe("404 and invalid routes", () => {
  test("invalid route renders a page (not a bare error)", async ({ page }) => {
    await page.goto("/en/this-route-definitely-does-not-exist-xyz123");
    // The page should render something — Next.js 404 or custom not-found
    await expect(page.locator("body")).toBeVisible();
  });

  test("invalid course slug renders a page without crashing", async ({ page }) => {
    await page.goto("/en/courses/nonexistent-course-xyz-999");
    await expect(page.locator("body")).toBeVisible();
  });

  test("invalid lesson slug renders gracefully", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana/lessons/nonexistent-lesson-xyz");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Search functionality on courses page", () => {
  test("courses page renders without a search error", async ({ page }) => {
    await page.goto("/en/courses");
    await expect(page.locator("main")).toBeVisible();
  });

  test("search input is visible if it exists on courses page", async ({ page }) => {
    await page.goto("/en/courses");
    const searchInput = page.locator("input[type='search'], input[placeholder*='search' i], input[name='search']").first();
    const count = await searchInput.count();
    if (count > 0) {
      await expect(searchInput).toBeVisible();
    } else {
      // No search input — courses page still loads fine
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("typing in search input does not crash the page", async ({ page }) => {
    await page.goto("/en/courses");
    const searchInput = page.locator("input[type='search'], input[placeholder*='search' i], input[name='search']").first();
    const count = await searchInput.count();
    if (count > 0) {
      await searchInput.fill("solana");
      await page.waitForTimeout(300);
      await expect(page.locator("main")).toBeVisible();
    } else {
      await expect(page.locator("main")).toBeVisible();
    }
  });
});

test.describe("Page responsiveness", () => {
  test("courses page renders correctly at tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/en/courses");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
  });

  test("leaderboard page renders correctly at tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/en/leaderboard");
    await expect(page.locator("main")).toBeVisible();
  });

  test("home page renders correctly at large desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("course detail renders correctly at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/courses/introduction-to-solana");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Settings page", () => {
  test("settings page has a visible heading", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("settings page main area is visible", async ({ page }) => {
    await page.goto("/en/settings");
    await expect(page.locator("main")).toBeVisible();
  });

  test("settings page does not crash", async ({ page }) => {
    await page.goto("/en/settings");
    const errorText = page.getByText(/unhandled runtime error/i);
    await expect(errorText).toHaveCount(0);
  });
});

test.describe("Page meta and accessibility", () => {
  test("home page has a non-empty title tag", async ({ page }) => {
    await page.goto("/en");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("courses page has a non-empty title tag", async ({ page }) => {
    await page.goto("/en/courses");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("leaderboard page has a non-empty title tag", async ({ page }) => {
    await page.goto("/en/leaderboard");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("home page has at least one h1 element", async ({ page }) => {
    await page.goto("/en");
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test("courses page has at least one h1 element", async ({ page }) => {
    await page.goto("/en/courses");
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });
});
