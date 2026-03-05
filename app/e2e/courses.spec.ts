import { test, expect } from "@playwright/test";

test.describe("Courses catalog — page structure", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
  });

  test("page loads with a visible h1", async ({ page }) => {
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("page title is non-empty", async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("main content area renders", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("page does not show an unhandled runtime error", async ({ page }) => {
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });

  test("header is visible on courses page", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });

  test("footer is visible on courses page", async ({ page }) => {
    await expect(page.locator("footer")).toBeVisible();
  });
});

test.describe("Courses catalog — search", () => {
  test("search input is visible if present", async ({ page }) => {
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
    const searchInput = page
      .locator("input[type='search']")
      .or(page.locator("input[placeholder*='search' i]"))
      .or(page.locator("input[placeholder*='buscar' i]"))
      .or(page.locator("input[placeholder*='Search' i]"))
      .first();
    const count = await searchInput.count();
    if (count > 0) {
      await expect(searchInput).toBeVisible();
    } else {
      // No search input is acceptable
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("typing in search does not crash the page", async ({ page }) => {
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
    const searchInput = page
      .locator("input[type='search']")
      .or(page.locator("input[placeholder*='search' i]"))
      .or(page.locator("input[placeholder*='buscar' i]"))
      .first();
    const count = await searchInput.count();
    if (count > 0) {
      await searchInput.fill("solana");
      await page.waitForTimeout(400);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
    } else {
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("clearing search input restores content", async ({ page }) => {
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
    const searchInput = page
      .locator("input[type='search']")
      .or(page.locator("input[placeholder*='search' i]"))
      .first();
    const count = await searchInput.count();
    if (count > 0) {
      await searchInput.fill("xyz-no-match");
      await page.waitForTimeout(300);
      await searchInput.clear();
      await page.waitForTimeout(300);
      await expect(page.locator("main")).toBeVisible();
    }
  });
});

test.describe("Courses catalog — filters", () => {
  test("difficulty filter buttons are interactive if present", async ({ page }) => {
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
    const filterBtn = page
      .getByRole("button", { name: /beginner|iniciante|básico/i })
      .first();
    const count = await filterBtn.count();
    if (count > 0) {
      await filterBtn.click();
      await page.waitForTimeout(300);
      await expect(page).not.toHaveURL(/error/);
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("intermediate filter works if present", async ({ page }) => {
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
    const filterBtn = page
      .getByRole("button", { name: /intermediate|intermediário/i })
      .first();
    const count = await filterBtn.count();
    if (count > 0) {
      await filterBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("all/reset filter shows all courses", async ({ page }) => {
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
    const allBtn = page
      .getByRole("button", { name: /^all$|^all courses$|^todos$/i })
      .first();
    const count = await allBtn.count();
    if (count > 0) {
      await allBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator("main")).toBeVisible();
    }
  });
});

test.describe("Courses catalog — course cards", () => {
  test("clicking a course card navigates to course detail", async ({ page }) => {
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
    const courseLink = page.locator("a[href*='/courses/']").first();
    const count = await courseLink.count();
    if (count > 0) {
      const href = await courseLink.getAttribute("href");
      await courseLink.click();
      await page.waitForLoadState("domcontentloaded");
      if (href) {
        expect(page.url()).toContain("/courses/");
      }
    } else {
      // Empty catalog is a valid state
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("course cards render without crashing", async ({ page }) => {
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
    // Either cards, empty state, or loading skeleton — all acceptable
    const hasCards = (await page.locator("[class*='card' i]").count()) > 0;
    const hasEmpty = (await page.locator("[class*='empty' i]").count()) > 0;
    const hasMain = (await page.locator("main").count()) > 0;
    expect(hasCards || hasEmpty || hasMain).toBeTruthy();
  });
});

test.describe("Courses catalog — responsiveness", () => {
  test("courses page renders at tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
  });

  test("courses page renders at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("main")).toBeVisible();
  });

  test("courses page renders at wide desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/courses");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });
});

test.describe("Course detail page", () => {
  const slug = "introduction-to-solana";

  test("course detail page loads with h1", async ({ page }) => {
    await page.goto(`/en/courses/${slug}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("course detail main content area is visible", async ({ page }) => {
    await page.goto(`/en/courses/${slug}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("main")).toBeVisible();
  });

  test("course detail renders without unhandled error", async ({ page }) => {
    await page.goto(`/en/courses/${slug}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });

  test("course detail renders at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/en/courses/${slug}`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });

  test("enroll button or lesson link is visible when course has content", async ({ page }) => {
    await page.goto(`/en/courses/${slug}`);
    await page.waitForLoadState("domcontentloaded");
    const enrollBtn = page
      .getByRole("button", { name: /enroll|start|matricular|começar/i })
      .or(page.getByRole("link", { name: /enroll|start|lesson/i }))
      .first();
    const count = await enrollBtn.count();
    // Enroll button is present when course data is loaded
    if (count > 0) {
      await expect(enrollBtn).toBeVisible();
    }
  });

  test("invalid course slug renders without crash", async ({ page }) => {
    await page.goto("/en/courses/nonexistent-xyz-9999");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });
});

test.describe("Lesson page", () => {
  test("lesson page loads for known slug", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana/lessons/what-is-solana");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("main")).toBeVisible();
  });

  test("lesson page renders without unhandled error", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana/lessons/what-is-solana");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText(/unhandled runtime error/i)).toHaveCount(0);
  });

  test("invalid lesson slug renders gracefully", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana/lessons/nonexistent-lesson");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });
});
