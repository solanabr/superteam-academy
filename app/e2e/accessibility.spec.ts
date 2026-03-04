import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("landing page has proper document structure", async ({ page }) => {
    await page.goto("/en");

    // Has a single h1
    const h1s = await page.locator("h1").count();
    expect(h1s).toBe(1);

    // Has lang attribute
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");

    // Has meta description
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute("content", /Solana/);
  });

  test("all pages have proper heading hierarchy", async ({ page }) => {
    const pages = [
      "/en",
      "/en/courses",
      "/en/leaderboard",
      "/en/dashboard",
      "/en/onboarding",
    ];

    for (const path of pages) {
      await page.goto(path);
      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    }
  });

  test("images have alt text", async ({ page }) => {
    await page.goto("/en");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).not.toBeNull();
    }
  });

  test("navigation is keyboard accessible", async ({ page }) => {
    await page.goto("/en");

    // Tab through nav items
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });

  test("buttons are focusable and interactive", async ({ page }) => {
    await page.goto("/en");

    const connectBtn = page.getByRole("button", { name: "Connect Wallet" });
    await connectBtn.focus();
    await expect(connectBtn).toBeFocused();
  });
});

test.describe("Responsive Design", () => {
  test("mobile viewport renders without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en");

    const body = page.locator("body");
    const bodyWidth = await body.evaluate(
      (el) => el.scrollWidth <= el.clientWidth
    );
    expect(bodyWidth).toBe(true);
  });

  test("desktop navigation is visible on large screens", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/en");
    await expect(
      page.getByRole("link", { name: "Courses" }).first()
    ).toBeVisible();
  });
});

test.describe("i18n", () => {
  test("landing page renders in English at /en", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByText("Learn to build on Solana")).toBeVisible();
  });
});
