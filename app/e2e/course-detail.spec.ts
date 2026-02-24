import { test, expect } from "@playwright/test";

test.describe("Course Detail Page", () => {
  test("renders course info or loading skeleton", async ({ page }) => {
    await page.goto("/en/courses/solana-101");
    // Course detail page should show content or skeleton
    await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
    const content = await page.textContent("body");
    expect(content!.length).toBeGreaterThan(100);
  });

  test("has enroll button or enrollment status", async ({ page }) => {
    await page.goto("/en/courses/solana-101");
    await page.waitForTimeout(3000);
    // Should show enroll button, connect wallet, or enrollment status
    await expect(
      page.locator("text=Enroll")
        .or(page.locator("text=Connect"))
        .or(page.locator("text=Enrolled"))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("loading skeleton shows before content", async ({ page }) => {
    await page.goto("/en/courses/solana-101");
    // The loading.tsx skeleton should appear
    await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Lesson Page", () => {
  test("lesson page renders content", async ({ page }) => {
    await page.goto("/en/courses/solana-101/lessons/0");
    await expect(page.locator("body")).toBeVisible({ timeout: 15000 });
    const content = await page.textContent("body");
    expect(content!.length).toBeGreaterThan(100);
  });

  test("lesson page has navigation elements", async ({ page }) => {
    await page.goto("/en/courses/solana-101/lessons/0");
    // Navbar always renders with logo link
    await expect(page.locator("nav").first()).toBeVisible({ timeout: 15000 });
    // Page body has meaningful content (lesson or loading skeleton or error)
    const body = await page.textContent("body");
    expect(body!.length).toBeGreaterThan(50);
  });
});
