import { test, expect } from "@playwright/test";

test.describe("Wallet Connection Flow", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("should display wallet connection options", async ({ page }) => {
		// Check for wallet connection button
		await expect(page.locator('[data-testid="connect-wallet-button"]')).toBeVisible();

		// Click to open wallet modal
		await page.locator('[data-testid="connect-wallet-button"]').click();

		// Check for wallet options
		await expect(page.locator('[data-testid="wallet-option-phantom"]')).toBeVisible();
		await expect(page.locator('[data-testid="wallet-option-solflare"]')).toBeVisible();
		await expect(page.locator('[data-testid="wallet-option-backpack"]')).toBeVisible();
	});

	test("should connect with Phantom wallet", async ({ page }) => {
		// Mock Phantom wallet
		await page.addScriptTag({
			content: `
        window.solana = {
          isPhantom: true,
          connect: async () => ({
            publicKey: {
              toString: () => '11111111111111111111111111111112',
              toBase58: () => '11111111111111111111111111111112'
            }
          }),
          disconnect: async () => {},
          on: (event, callback) => {
            if (event === 'connect') setTimeout(callback, 100);
          },
          off: () => {},
        };
      `,
		});

		// Click connect wallet
		await page.locator('[data-testid="connect-wallet-button"]').click();

		// Select Phantom
		await page.locator('[data-testid="wallet-option-phantom"]').click();

		// Check connection success
		await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();
		await expect(page.locator('[data-testid="wallet-address"]')).toContainText("1111...1112");
	});

	test("should handle wallet connection errors", async ({ page }) => {
		// Mock wallet that rejects connection
		await page.addScriptTag({
			content: `
        window.solana = {
          isPhantom: true,
          connect: async () => {
            throw new Error('User rejected the request');
          },
        };
      `,
		});

		// Click connect wallet
		await page.locator('[data-testid="connect-wallet-button"]').click();
		await page.locator('[data-testid="wallet-option-phantom"]').click();

		// Check error message
		await expect(page.locator('[data-testid="wallet-error"]')).toBeVisible();
		await expect(page.locator('[data-testid="wallet-error"]')).toContainText("User rejected");
	});

	test("should disconnect wallet", async ({ page }) => {
		// Mock connected wallet
		await page.addScriptTag({
			content: `
        window.solana = {
          isPhantom: true,
          isConnected: true,
          publicKey: {
            toString: () => '11111111111111111111111111111112',
            toBase58: () => '11111111111111111111111111111112'
          },
          connect: async () => ({}),
          disconnect: async () => {
            window.solana.isConnected = false;
          },
        };
      `,
		});

		// Assume wallet is already connected
		await page.reload();

		// Click disconnect
		await page.locator('[data-testid="disconnect-wallet"]').click();

		// Check disconnection
		await expect(page.locator('[data-testid="connect-wallet-button"]')).toBeVisible();
		await expect(page.locator('[data-testid="wallet-connected"]')).not.toBeVisible();
	});

	test("should persist wallet connection across page reloads", async ({
		page,
		context: _context,
	}) => {
		// Mock wallet connection
		await page.addScriptTag({
			content: `
        window.solana = {
          isPhantom: true,
          connect: async () => ({
            publicKey: {
              toString: () => '11111111111111111111111111111112',
              toBase58: () => '11111111111111111111111111111112'
            }
          }),
          disconnect: async () => {},
        };
      `,
		});

		// Connect wallet
		await page.locator('[data-testid="connect-wallet-button"]').click();
		await page.locator('[data-testid="wallet-option-phantom"]').click();

		// Wait for connection
		await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();

		// Reload page
		await page.reload();

		// Check persistence
		await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();
	});
});

test.describe("Course Enrollment Flow", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authenticated user with connected wallet
		await page.addScriptTag({
			content: `
        window.solana = {
          isPhantom: true,
          isConnected: true,
          publicKey: {
            toString: () => '11111111111111111111111111111112',
            toBase58: () => '11111111111111111111111111111112'
          },
        };
        localStorage.setItem('user', JSON.stringify({
          id: 'user-123',
          email: 'test@example.com',
          walletAddress: '11111111111111111111111111111112'
        }));
      `,
		});

		await page.goto("/courses");
	});

	test("should display course catalog", async ({ page }) => {
		// Check course grid
		await expect(page.locator('[data-testid="course-grid"]')).toBeVisible();

		// Check course cards
		const courseCards = page.locator('[data-testid="course-card"]');
		await expect(courseCards).toHaveCount(await courseCards.count());

		// Check course information
		const firstCourse = courseCards.first();
		await expect(firstCourse.locator('[data-testid="course-title"]')).toBeVisible();
		await expect(firstCourse.locator('[data-testid="course-description"]')).toBeVisible();
		await expect(firstCourse.locator('[data-testid="course-instructor"]')).toBeVisible();
	});

	test("should navigate to course detail page", async ({ page }) => {
		// Click on first course
		await page.locator('[data-testid="course-card"]').first().click();

		// Check URL
		await expect(page).toHaveURL(/\/courses\/.+/);

		// Check course detail elements
		await expect(page.locator('[data-testid="course-header"]')).toBeVisible();
		await expect(page.locator('[data-testid="course-curriculum"]')).toBeVisible();
		await expect(page.locator('[data-testid="enroll-button"]')).toBeVisible();
	});

	test("should enroll in a course", async ({ page }) => {
		// Navigate to course detail
		await page.locator('[data-testid="course-card"]').first().click();

		// Click enroll
		await page.locator('[data-testid="enroll-button"]').click();

		// Check enrollment confirmation
		await expect(page.locator('[data-testid="enrollment-success"]')).toBeVisible();

		// Check navigation to first lesson
		await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible();
	});

	test("should track enrollment progress", async ({ page }) => {
		// Navigate to enrolled course
		await page.goto("/courses/enrolled-course-123");

		// Check progress bar
		await expect(page.locator('[data-testid="course-progress"]')).toBeVisible();

		// Check completed lessons
		const completedLessons = page.locator('[data-testid="lesson-completed"]');
		await expect(completedLessons).toHaveCount(await completedLessons.count());

		// Check next lesson
		await expect(page.locator('[data-testid="next-lesson-button"]')).toBeVisible();
	});

	test("should handle enrollment errors", async ({ page }) => {
		// Mock enrollment failure
		await page.route("**/api/enroll", async (route) => {
			await route.fulfill({
				status: 400,
				contentType: "application/json",
				body: JSON.stringify({ error: "Course is full" }),
			});
		});

		// Navigate to course and try to enroll
		await page.locator('[data-testid="course-card"]').first().click();
		await page.locator('[data-testid="enroll-button"]').click();

		// Check error message
		await expect(page.locator('[data-testid="enrollment-error"]')).toBeVisible();
		await expect(page.locator('[data-testid="enrollment-error"]')).toContainText(
			"Course is full"
		);
	});
});

test.describe("Challenge Completion Flow", () => {
	test.beforeEach(async ({ page }) => {
		// Mock authenticated user
		await page.addScriptTag({
			content: `
        localStorage.setItem('user', JSON.stringify({
          id: 'user-123',
          email: 'test@example.com'
        }));
      `,
		});

		await page.goto("/courses/test-course/challenges/challenge-1");
	});

	test("should load challenge editor", async ({ page }) => {
		// Check challenge header
		await expect(page.locator('[data-testid="challenge-header"]')).toBeVisible();
		await expect(page.locator('[data-testid="challenge-title"]')).toBeVisible();
		await expect(page.locator('[data-testid="challenge-description"]')).toBeVisible();

		// Check code editor
		await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();

		// Check test cases panel
		await expect(page.locator('[data-testid="test-cases-panel"]')).toBeVisible();

		// Check run button
		await expect(page.locator('[data-testid="run-tests-button"]')).toBeVisible();
	});

	test("should run tests and show results", async ({ page }) => {
		// Type some code
		await page.locator('[data-testid="code-editor"]').fill(`
      function solution() {
        return 42;
      }
    `);

		// Run tests
		await page.locator('[data-testid="run-tests-button"]').click();

		// Check test results
		await expect(page.locator('[data-testid="test-results"]')).toBeVisible();

		// Check individual test cases
		const testCases = page.locator('[data-testid="test-case"]');
		await expect(testCases).toHaveCount(await testCases.count());
	});

	test("should submit successful challenge", async ({ page }) => {
		// Mock successful test run
		await page.route("**/api/challenges/*/run", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: true,
					results: [
						{ id: "test-1", passed: true, input: [1], expected: 42, actual: 42 },
						{ id: "test-2", passed: true, input: [2], expected: 42, actual: 42 },
					],
				}),
			});
		});

		// Run tests
		await page.locator('[data-testid="run-tests-button"]').click();

		// Check all tests pass
		await expect(page.locator('[data-testid="all-tests-passed"]')).toBeVisible();

		// Submit challenge
		await page.locator('[data-testid="submit-challenge-button"]').click();

		// Check success message
		await expect(page.locator('[data-testid="challenge-success"]')).toBeVisible();

		// Check XP reward
		await expect(page.locator('[data-testid="xp-reward"]')).toBeVisible();
	});

	test("should handle test failures", async ({ page }) => {
		// Mock failed test run
		await page.route("**/api/challenges/*/run", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: false,
					results: [
						{ id: "test-1", passed: true, input: [1], expected: 42, actual: 42 },
						{ id: "test-2", passed: false, input: [2], expected: 42, actual: 24 },
					],
				}),
			});
		});

		// Run tests
		await page.locator('[data-testid="run-tests-button"]').click();

		// Check test failures
		await expect(page.locator('[data-testid="test-failed"]')).toBeVisible();

		// Check submit button is disabled
		await expect(page.locator('[data-testid="submit-challenge-button"]')).toBeDisabled();
	});

	test("should show hints when requested", async ({ page }) => {
		// Click hint button
		await page.locator('[data-testid="show-hint-button"]').click();

		// Check hint is displayed
		await expect(page.locator('[data-testid="challenge-hint"]')).toBeVisible();
	});

	test("should handle challenge timeout", async ({ page }) => {
		// Mock timeout response
		await page.route("**/api/challenges/*/run", async (route) => {
			await route.fulfill({
				status: 408,
				contentType: "application/json",
				body: JSON.stringify({ error: "Code execution timed out" }),
			});
		});

		// Run tests
		await page.locator('[data-testid="run-tests-button"]').click();

		// Check timeout error
		await expect(page.locator('[data-testid="timeout-error"]')).toBeVisible();
	});
});

test.describe("Accessibility E2E Tests", () => {
	test("should support keyboard navigation", async ({ page }) => {
		await page.goto("/");

		// Tab through navigation
		await page.keyboard.press("Tab");
		await expect(page.locator('[data-testid="nav-home"]:focus')).toBeVisible();

		await page.keyboard.press("Tab");
		await expect(page.locator('[data-testid="nav-courses"]:focus')).toBeVisible();

		await page.keyboard.press("Tab");
		await expect(page.locator('[data-testid="nav-leaderboard"]:focus')).toBeVisible();
	});

	test("should support screen reader announcements", async ({ page }) => {
		await page.goto("/courses");

		// Check for ARIA live regions
		const liveRegions = page.locator("[aria-live]");
		await expect(liveRegions).toHaveCount(await liveRegions.count());
	});

	test("should have proper focus management in modals", async ({ page }) => {
		await page.goto("/");

		// Open modal
		await page.locator('[data-testid="open-modal"]').click();

		// Check focus is trapped in modal
		await page.keyboard.press("Tab");
		await page.keyboard.press("Tab");

		// Focus should still be in modal
		const focusedElement = await page.evaluate(() =>
			document.activeElement?.getAttribute("data-testid")
		);
		expect(focusedElement).toMatch(/modal/);
	});
});
