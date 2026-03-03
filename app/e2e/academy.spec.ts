import { test, expect } from "@playwright/test";

const BASE_URL = "https://superteam-academy-psi.vercel.app";

// ─── Test 1: Landing Page ─────────────────────────────────────────────────────
test("landing page loads correctly", async ({ page }) => {
  await page.goto(BASE_URL);

  // Check title
  await expect(page).toHaveTitle(/Superteam Academy/i);

  // Check hero text
  await expect(page.getByText("LEARN")).toBeVisible();
  await expect(page.getByText("BUILD")).toBeVisible();
  await expect(page.getByText("EARN.")).toBeVisible();

  // Check CTA button
  await expect(page.getByText("START_LEARNING")).toBeVisible();

  // Check partner logos section
  await expect(page.getByText("TRUSTED BY THE SOLANA ECOSYSTEM")).toBeVisible();

  // Check navbar
  await expect(page.getByText("SUPERTEAM ACADEMY")).toBeVisible();
});

// ─── Test 2: Courses Page ─────────────────────────────────────────────────────
test("courses page loads and displays courses", async ({ page }) => {
  await page.goto(`${BASE_URL}/courses`);

  // Check page heading
  await expect(page.getByRole("heading", { name: /courses/i })).toBeVisible();

  // Check search input exists
  await expect(page.getByPlaceholder(/search/i)).toBeVisible();

  // Check at least one course card is visible
  const courseCards = page.locator("[data-testid='course-card']");
  const count = await courseCards.count();

  // If no data-testid, check for course content
  if (count === 0) {
    await expect(page.getByText(/beginner|intermediate|advanced/i).first()).toBeVisible();
  } else {
    expect(count).toBeGreaterThan(0);
  }
});

// ─── Test 3: Navigation Flow ──────────────────────────────────────────────────
test("navigation works across main pages", async ({ page }) => {
  await page.goto(BASE_URL);

  // Navigate to Courses
  await page.getByRole("link", { name: /courses/i }).first().click();
  await expect(page).toHaveURL(/\/courses/);

  // Navigate to Leaderboard
  await page.getByRole("link", { name: /leaderboard/i }).first().click();
  await expect(page).toHaveURL(/\/leaderboard/);

  // Navigate to Practice
  await page.getByRole("link", { name: /practice/i }).first().click();
  await expect(page).toHaveURL(/\/practice/);

  // Navigate back home via logo
  await page.getByRole("link", { name: /superteam academy/i }).first().click();
  await expect(page).toHaveURL(BASE_URL + "/");
});
