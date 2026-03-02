import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("Superteam Academy")).toBeVisible();
  });

  test("renders stats bar", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("500+")).toBeVisible();
  });

  test("navigate to courses from CTA", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: /explore courses/i }).click();
    await expect(page).toHaveURL(/\/en\/courses/);
  });

  test("theme toggle works", async ({ page }) => {
    await page.goto("/en");
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);
    await page.getByRole("button", { name: /toggle theme/i }).click();
    await expect(html).not.toHaveClass(/dark/);
  });
});
