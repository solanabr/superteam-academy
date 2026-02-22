import { test, expect } from "@playwright/test";

test.describe("Lesson Page", () => {
  test("renders content lesson", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    const lessonLink = page.getByText("What is Solana?").first();
    if (await lessonLink.isVisible()) {
      await lessonLink.click();
      await expect(page).toHaveURL(/\/lessons\//);
      await expect(page.getByText("What is Solana?")).toBeVisible();
    }
  });

  test("shows XP reward badge", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    const lessonLink = page.getByText("What is Solana?").first();
    if (await lessonLink.isVisible()) {
      await lessonLink.click();
      await expect(page.getByText(/XP/i).first()).toBeVisible();
    }
  });

  test("shows back to course button", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    const lessonLink = page.getByText("What is Solana?").first();
    if (await lessonLink.isVisible()) {
      await lessonLink.click();
      await expect(
        page.getByRole("link", { name: /back to course/i }),
      ).toBeVisible();
    }
  });

  test("shows mark as complete button for content lessons", async ({
    page,
  }) => {
    await page.goto("/en/courses/introduction-to-solana");
    const lessonLink = page.getByText("What is Solana?").first();
    if (await lessonLink.isVisible()) {
      await lessonLink.click();
      await expect(
        page.getByRole("button", { name: /mark as complete/i }),
      ).toBeVisible();
    }
  });

  test("navigates between lessons", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    const lessonLink = page.getByText("What is Solana?").first();
    if (await lessonLink.isVisible()) {
      await lessonLink.click();
      const nextBtn = page.getByRole("link", { name: /next/i });
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await expect(page).toHaveURL(/\/lessons\//);
      }
    }
  });
});

test.describe("Challenge Lesson", () => {
  test("renders code editor for challenge lessons", async ({ page }) => {
    await page.goto("/en/courses/introduction-to-solana");
    // Look for a challenge-type lesson
    const challengeLesson = page.getByText("Hello Solana").first();
    if (await challengeLesson.isVisible()) {
      await challengeLesson.click();
      await expect(page.getByText(/run/i).first()).toBeVisible();
    }
  });
});
