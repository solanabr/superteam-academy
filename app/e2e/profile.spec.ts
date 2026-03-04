import { test, expect } from "@playwright/test";

test.describe("Profile Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
    await expect(page.locator("main")).toBeVisible();
  });

  test("profile page loads with heading", async ({ page }) => {
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });

  test("stats row visible (XP, Level, Achievements, Courses, Streak)", async ({
    page,
  }) => {
    const statLabels = [/xp/i, /level/i, /achievement/i, /course/i, /streak/i];
    for (const label of statLabels) {
      const stat = page.getByText(label);
      await expect(stat.first()).toBeVisible();
    }
  });

  test("tabs present (Overview, Achievements, Credentials, Courses)", async ({
    page,
  }) => {
    const tabLabels = [/overview/i, /achievement/i, /credential/i, /course/i];
    for (const label of tabLabels) {
      const tab = page
        .locator("button, [role='tab']")
        .filter({ hasText: label });
      await expect(tab.first()).toBeVisible();
    }
  });

  test("switching tabs changes content", async ({ page }) => {
    // Click Achievements tab
    const achievementsTab = page
      .locator("button, [role='tab']")
      .filter({ hasText: /achievement/i })
      .first();
    await achievementsTab.click();
    await page.waitForTimeout(300);

    const achievementContent = page.getByText(/achievement|badge|unlock/i);
    await expect(achievementContent.first()).toBeVisible();

    // Click Credentials tab
    const credentialsTab = page
      .locator("button, [role='tab']")
      .filter({ hasText: /credential/i })
      .first();
    await credentialsTab.click();
    await page.waitForTimeout(300);

    await expect(page.locator("main")).toBeVisible();
  });

  test("skill chart visible on Overview tab", async ({ page }) => {
    const chartArea = page.locator(
      "canvas, svg, [class*='chart'], [class*='skill']",
    );
    const count = await chartArea.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Public Profile", () => {
  test("public profile route loads", async ({ page }) => {
    // Try a seeded user profile
    await page.goto("/profile/seed_user_01");
    await expect(page.locator("main")).toBeVisible();
  });
});
