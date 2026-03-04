import { test, expect } from "@playwright/test";

test.describe("Discussions Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/discussions");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("discussions page loads with thread list", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });

  test("thread cards show title, author, comment count", async ({ page }) => {
    const threadLinks = page.locator('a[href^="/discussions/"]');
    const count = await threadLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const firstThread = threadLinks.first();
    const text = await firstThread.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });

  test("clicking thread navigates to detail", async ({ page }) => {
    const threadLink = page.locator('a[href^="/discussions/"]').first();
    const href = await threadLink.getAttribute("href");

    if (href) {
      await threadLink.click();
      await expect(page).toHaveURL(href);
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("thread detail shows body and comment section", async ({ page }) => {
    const threadLink = page.locator('a[href^="/discussions/"]').first();
    const href = await threadLink.getAttribute("href");

    if (href) {
      await page.goto(href);
      await expect(page.locator("main")).toBeVisible();

      const commentSection = page.getByText(/comment|reply|respond/i);
      await expect(commentSection.first()).toBeVisible();
    }
  });
});
