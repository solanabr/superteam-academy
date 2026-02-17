import { test, expect } from "@playwright/test";

test.describe("Superteam Academy E2E Tests", () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the application
		await page.goto("/");
	});

	test("should load the homepage", async ({ page }) => {
		// Check if the page loads
		await expect(page).toHaveTitle(/Superteam Academy/);

		// Check for main content
		await expect(page.locator("main")).toBeVisible();
	});

	test("should navigate to courses page", async ({ page }) => {
		// Click on courses navigation
		await page.locator('[data-testid="nav-courses"]').click();

		// Check if we're on the courses page
		await expect(page).toHaveURL(/.*courses/);

		// Check for course listings
		await expect(page.locator('[data-testid="course-card"]')).toHaveCount(1);
	});

	test("should handle wallet connection flow", async ({ page }) => {
		// Mock wallet connection
		await page.addScriptTag({
			content: `
        window.solana = {
          isPhantom: true,
          connect: async () => ({
            publicKey: { toString: () => '11111111111111111111111111111112' }
          }),
          disconnect: async () => {},
        };
      `,
		});

		// Click connect wallet button
		await page.locator('[data-testid="connect-wallet"]').click();

		// Check if wallet is connected
		await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();
	});

	test("should complete a lesson", async ({ page }) => {
		// Navigate to a course
		await page.goto("/courses/test-course");

		// Start a lesson
		await page.locator('[data-testid="start-lesson"]').click();

		// Complete the lesson (mock completion)
		await page.locator('[data-testid="complete-lesson"]').click();

		// Check for completion confirmation
		await expect(page.locator('[data-testid="lesson-completed"]')).toBeVisible();
	});

	test("should handle user authentication", async ({ page }) => {
		// Navigate to login
		await page.locator('[data-testid="login-button"]').click();

		// Fill login form
		await page.locator('[data-testid="email-input"]').fill("test@example.com");
		await page.locator('[data-testid="password-input"]').fill("password123");

		// Submit form
		await page.locator('[data-testid="submit-login"]').click();

		// Check if logged in
		await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
	});

	test("should be responsive on mobile", async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Check mobile navigation
		await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

		// Open mobile menu
		await page.locator('[data-testid="mobile-menu-toggle"]').click();

		// Check menu items are visible
		await expect(page.locator('[data-testid="mobile-nav-courses"]')).toBeVisible();
	});

	test("should handle offline functionality", async ({ page }) => {
		// Go offline
		await page.context().setOffline(true);

		// Try to load a cached page
		await page.goto("/courses");

		// Check for offline message or cached content
		await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
	});
});
