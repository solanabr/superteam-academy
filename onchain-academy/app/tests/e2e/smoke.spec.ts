import { expect, test } from "@playwright/test";

test("landing and catalog render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/courses");
  await expect(
    page.getByRole("heading", { name: /Course Catalog/i }),
  ).toBeVisible();
});

test("leaderboard filter and settings load", async ({ page }) => {
  await page.goto("/leaderboard");
  await expect(
    page.getByRole("heading", { name: /Global Leaderboard/i }),
  ).toBeVisible();

  await page.getByRole("tab", { name: /Monthly/i }).click();
  await expect(page.getByRole("tab", { name: /Monthly/i })).toHaveAttribute(
    "data-state",
    "active",
  );

  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: /Account Settings/i }),
  ).toBeVisible();
});
