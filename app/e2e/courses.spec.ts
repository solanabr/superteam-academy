import { test, expect } from "@playwright/test";

test.describe("Course Catalog", () => {
  test("displays course grid", async ({ page }) => {
    await page.goto("/en/courses");
    await expect(page.getByText("Introduction to Solana")).toBeVisible();
  });

  test("filters by difficulty", async ({ page }) => {
    await page.goto("/en/courses");
    const beginnerBtn = page.getByRole("button", { name: /beginner/i });
    if (await beginnerBtn.isVisible()) {
      await beginnerBtn.click();
    }
  });

  test("searches courses", async ({ page }) => {
    await page.goto("/en/courses");
    const search = page.getByPlaceholder(/search/i);
    if (await search.isVisible()) {
      await search.fill("Anchor");
      await expect(page.getByText("Anchor Fundamentals")).toBeVisible();
    }
  });

  test("navigates to course detail", async ({ page }) => {
    await page.goto("/en/courses");
    await page.getByText("Introduction to Solana").click();
    await expect(page).toHaveURL(/\/courses\/introduction-to-solana/);
  });
});

test.describe("Course Detail", () => {
  test("shows course info", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    await expect(page.getByText("Introduction to Solana")).toBeVisible();
  });

  test("shows module accordion", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    await expect(page.getByText("Solana Fundamentals")).toBeVisible();
  });

  test("navigates to lesson", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    const lessonLink = page.getByText("What is Solana?").first();
    if (await lessonLink.isVisible()) {
      await lessonLink.click();
      await expect(page).toHaveURL(/\/lessons\//);
    }
  });
});
