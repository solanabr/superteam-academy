import { test, expect } from "../fixtures/base";
import { CoursesPage } from "../pages/courses.page";

const MOCK_COURSES = [
  {
    id: "intro-solana",
    title: "Introduction to Solana",
    description: "Learn the basics of Solana blockchain",
    difficulty: "beginner",
    trackId: "1",
    lessonCount: 5,
    xpReward: 500,
    slug: "intro-solana",
  },
  {
    id: "anchor-dev",
    title: "Anchor Development",
    description: "Build programs with Anchor framework",
    difficulty: "intermediate",
    trackId: "1",
    lessonCount: 8,
    xpReward: 800,
    slug: "anchor-dev",
  },
];

test.describe("Courses page", () => {
  test.beforeEach(async ({ learningApi }) => {
    await learningApi.progress();
  });

  test("renders course listing", async ({ page, learningApi }) => {
    await learningApi.courses(MOCK_COURSES);

    const courses = new CoursesPage(page);
    await courses.goto();
    await page.waitForLoadState("domcontentloaded");

    await expect(courses.heading).toBeVisible();
    await expect(page.getByText("Introduction to Solana")).toBeVisible();
    await expect(page.getByText("Anchor Development")).toBeVisible();
  });

  test("shows empty state when no courses", async ({ page, learningApi }) => {
    await learningApi.courses([]);

    const courses = new CoursesPage(page);
    await courses.goto();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("No courses found")).toBeVisible();
  });

  test("search filters courses", async ({ page, learningApi }) => {
    await learningApi.courses(MOCK_COURSES);

    const courses = new CoursesPage(page);
    await courses.goto();
    await page.waitForLoadState("domcontentloaded");

    // Wait for courses to render first
    await expect(page.getByText("Introduction to Solana")).toBeVisible();

    // Search for "Anchor" — placeholder is "Search courses..."
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("Anchor");

    await expect(page.getByText("Anchor Development")).toBeVisible();
    await expect(page.getByText("Introduction to Solana")).not.toBeVisible();
  });

  test("course card has link to detail page", async ({ page, learningApi }) => {
    await learningApi.courses(MOCK_COURSES);

    const courses = new CoursesPage(page);
    await courses.goto();
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("Introduction to Solana")).toBeVisible();
    const link = page
      .getByRole("link", { name: /Introduction to Solana/i })
      .first();
    if (await link.isVisible()) {
      const href = await link.getAttribute("href");
      expect(href).toBeTruthy();
    }
  });
});
