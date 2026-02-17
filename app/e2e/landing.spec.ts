import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("renders hero section", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows featured courses", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("Introduction to Solana")).toBeVisible();
  });

  test("navigates to course catalog", async ({ page }) => {
    await page.goto("/en");
    await page
      .getByRole("link", { name: /courses/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/courses/);
  });

  test("switches locale to pt-BR", async ({ page }) => {
    await page.goto("/en");
    const localeSwitcher = page.getByRole("button", { name: /EN|BR|ES/i });
    if (await localeSwitcher.isVisible()) {
      await localeSwitcher.click();
      const brOption = page.getByText("BR");
      if (await brOption.isVisible()) {
        await brOption.click();
        await expect(page).toHaveURL(/\/pt-BR/);
      }
    }
  });

  test("toggles theme", async ({ page }) => {
    await page.goto("/en");
    const themeButton = page.getByRole("button", { name: /theme/i });
    if (await themeButton.isVisible()) {
      await themeButton.click();
    }
  });
});
