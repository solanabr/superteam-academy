import { test, expect } from "@playwright/test";

test.describe("Superteam Academy E2E Tests", () => {
	test.beforeEach(async ({ page }) => {
		// Set up test environment
		await page.goto("http://localhost:3000");

		// Wait for app to load
		await page.waitForLoadState("networkidle");
	});

	test.describe("Wallet Connection Flow", () => {
		test("should connect wallet successfully", async ({ page }) => {
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
            signTransaction: async (tx) => tx,
            signAllTransactions: async (txs) => txs,
            signMessage: async (msg) => new Uint8Array([1, 2, 3])
          }
        `,
			});

			// Click connect wallet button
			const connectButton = page.getByRole("button", { name: /connect wallet/i });
			await expect(connectButton).toBeVisible();
			await connectButton.click();

			// Verify connection
			await expect(page.getByText(/connected/i)).toBeVisible();
			await expect(page.getByText("11111111111111111111111111111112")).toBeVisible();
		});

		test("should handle wallet connection failure", async ({ page }) => {
			// Mock failed wallet connection
			await page.addScriptTag({
				content: `
          window.solana = {
            isPhantom: true,
            connect: async () => {
              throw new Error('User rejected the request')
            }
          }
        `,
			});

			// Click connect wallet button
			const connectButton = page.getByRole("button", { name: /connect wallet/i });
			await connectButton.click();

			// Verify error message
			await expect(page.getByText(/connection failed/i)).toBeVisible();
			await expect(page.getByText(/user rejected/i)).toBeVisible();
		});

		test("should disconnect wallet", async ({ page }) => {
			// First connect wallet
			await page.addScriptTag({
				content: `
          window.solana = {
            isPhantom: true,
            connect: async () => ({
              publicKey: {
                toString: () => '11111111111111111111111111111112'
              }
            }),
            disconnect: async () => {}
          }
        `,
			});

			const connectButton = page.getByRole("button", { name: /connect wallet/i });
			await connectButton.click();
			await expect(page.getByText(/connected/i)).toBeVisible();

			// Disconnect wallet
			const disconnectButton = page.getByRole("button", { name: /disconnect/i });
			await disconnectButton.click();

			// Verify disconnection
			await expect(page.getByText(/connect wallet/i)).toBeVisible();
			await expect(page.getByText(/connected/i)).not.toBeVisible();
		});
	});

	test.describe("Course Enrollment Flow", () => {
		test.beforeEach(async ({ page }) => {
			// Connect wallet first
			await page.addScriptTag({
				content: `
          window.solana = {
            isPhantom: true,
            connect: async () => ({
              publicKey: {
                toString: () => '11111111111111111111111111111112'
              }
            }),
            signTransaction: async (tx) => tx
          }
        `,
			});

			const connectButton = page.getByRole("button", { name: /connect wallet/i });
			await connectButton.click();
			await expect(page.getByText(/connected/i)).toBeVisible();
		});

		test("should display course catalog", async ({ page }) => {
			await page.goto("http://localhost:3000/courses");

			// Verify course grid is displayed
			await expect(page.getByRole("heading", { name: /courses/i })).toBeVisible();
			await expect(page.getByText(/introduction to solana/i)).toBeVisible();
		});

		test("should show course details", async ({ page }) => {
			await page.goto("http://localhost:3000/courses");

			// Click on a course
			await page.getByText(/introduction to solana/i).click();

			// Verify course details page
			await expect(
				page.getByRole("heading", { name: /introduction to solana/i })
			).toBeVisible();
			await expect(page.getByText(/learn the basics/i)).toBeVisible();
			await expect(page.getByRole("button", { name: /enroll/i })).toBeVisible();
		});

		test("should enroll in course", async ({ page }) => {
			await page.goto("http://localhost:3000/courses/intro-to-solana");

			// Click enroll button
			const enrollButton = page.getByRole("button", { name: /enroll/i });
			await enrollButton.click();

			// Confirm enrollment in modal
			await page.getByRole("button", { name: /confirm/i }).click();

			// Verify enrollment success
			await expect(page.getByText(/successfully enrolled/i)).toBeVisible();
			await expect(page.getByRole("button", { name: /start learning/i })).toBeVisible();
		});

		test("should handle enrollment failure", async ({ page }) => {
			// Mock enrollment failure
			await page.route("**/enroll", async (route) => {
				await route.fulfill({
					status: 400,
					contentType: "application/json",
					body: JSON.stringify({ error: "Insufficient balance" }),
				});
			});

			await page.goto("http://localhost:3000/courses/intro-to-solana");

			const enrollButton = page.getByRole("button", { name: /enroll/i });
			await enrollButton.click();
			await page.getByRole("button", { name: /confirm/i }).click();

			// Verify error message
			await expect(page.getByText(/insufficient balance/i)).toBeVisible();
		});
	});

	test.describe("Lesson Completion Flow", () => {
		test.beforeEach(async ({ page }) => {
			// Connect wallet and enroll in course
			await page.addScriptTag({
				content: `
          window.solana = {
            isPhantom: true,
            connect: async () => ({
              publicKey: {
                toString: () => '11111111111111111111111111111112'
              }
            }),
            signTransaction: async (tx) => tx
          }
        `,
			});

			const connectButton = page.getByRole("button", { name: /connect wallet/i });
			await connectButton.click();
			await expect(page.getByText(/connected/i)).toBeVisible();
		});

		test("should display lesson content", async ({ page }) => {
			await page.goto("http://localhost:3000/learn/intro-to-solana/lesson-1");

			// Verify lesson content is displayed
			await expect(page.getByRole("heading", { name: /what is solana/i })).toBeVisible();
			await expect(page.getByText(/blockchain platform/i)).toBeVisible();
		});

		test("should complete lesson with quiz", async ({ page }) => {
			await page.goto("http://localhost:3000/learn/intro-to-solana/lesson-1");

			// Complete lesson content reading
			await page.getByRole("button", { name: /mark as read/i }).click();

			// Answer quiz questions
			await page.getByLabel(/what is solana/i).fill("A blockchain platform");
			await page.getByRole("button", { name: /submit/i }).click();

			// Verify completion
			await expect(page.getByText(/lesson completed/i)).toBeVisible();
			await expect(page.getByText(/\+25 xp/i)).toBeVisible();
		});

		test("should handle incorrect quiz answers", async ({ page }) => {
			await page.goto("http://localhost:3000/learn/intro-to-solana/lesson-1");

			await page.getByRole("button", { name: /mark as read/i }).click();

			// Answer incorrectly
			await page.getByLabel(/what is solana/i).fill("A social network");
			await page.getByRole("button", { name: /submit/i }).click();

			// Verify feedback
			await expect(page.getByText(/incorrect/i)).toBeVisible();
			await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
		});

		test("should navigate between lessons", async ({ page }) => {
			await page.goto("http://localhost:3000/learn/intro-to-solana/lesson-1");

			// Navigate to next lesson
			await page.getByRole("button", { name: /next lesson/i }).click();

			// Verify navigation
			await expect(page.url()).toContain("/lesson-2");
		});
	});

	test.describe("Challenge Completion Flow", () => {
		test.beforeEach(async ({ page }) => {
			// Connect wallet
			await page.addScriptTag({
				content: `
          window.solana = {
            isPhantom: true,
            connect: async () => ({
              publicKey: {
                toString: () => '11111111111111111111111111111112'
              }
            }),
            signTransaction: async (tx) => tx
          }
        `,
			});

			const connectButton = page.getByRole("button", { name: /connect wallet/i });
			await connectButton.click();
			await expect(page.getByText(/connected/i)).toBeVisible();
		});

		test("should display coding challenge", async ({ page }) => {
			await page.goto("http://localhost:3000/challenges/solana-hello-world");

			// Verify challenge interface
			await expect(page.getByRole("heading", { name: /hello world/i })).toBeVisible();
			await expect(page.getByText(/write a program/i)).toBeVisible();
			await expect(page.getByRole("button", { name: /run code/i })).toBeVisible();
		});

		test("should execute code and show results", async ({ page }) => {
			await page.goto("http://localhost:3000/challenges/solana-hello-world");

			// Write code in editor
			const editor = page.locator(".monaco-editor");
			await editor.click();
			await page.keyboard.type('console.log("Hello, Solana!");');

			// Run code
			await page.getByRole("button", { name: /run code/i }).click();

			// Verify output
			await expect(page.getByText(/hello, solana!/i)).toBeVisible();
		});

		test("should submit completed challenge", async ({ page }) => {
			await page.goto("http://localhost:3000/challenges/solana-hello-world");

			// Complete the challenge
			const editor = page.locator(".monaco-editor");
			await editor.click();
			await page.keyboard.type('console.log("Hello, Solana!");');

			await page.getByRole("button", { name: /run code/i }).click();
			await expect(page.getByText(/hello, solana!/i)).toBeVisible();

			// Submit challenge
			await page.getByRole("button", { name: /submit challenge/i }).click();

			// Verify submission
			await expect(page.getByText(/challenge completed/i)).toBeVisible();
			await expect(page.getByText(/\+100 xp/i)).toBeVisible();
		});

		test("should handle code execution errors", async ({ page }) => {
			await page.goto("http://localhost:3000/challenges/solana-hello-world");

			// Write invalid code
			const editor = page.locator(".monaco-editor");
			await editor.click();
			await page.keyboard.type("console.log("); // Invalid syntax

			await page.getByRole("button", { name: /run code/i }).click();

			// Verify error message
			await expect(page.getByText(/syntax error/i)).toBeVisible();
		});
	});

	test.describe("User Profile and Progress", () => {
		test.beforeEach(async ({ page }) => {
			// Connect wallet
			await page.addScriptTag({
				content: `
          window.solana = {
            isPhantom: true,
            connect: async () => ({
              publicKey: {
                toString: () => '11111111111111111111111111111112'
              }
            })
          }
        `,
			});

			const connectButton = page.getByRole("button", { name: /connect wallet/i });
			await connectButton.click();
			await expect(page.getByText(/connected/i)).toBeVisible();
		});

		test("should display user profile", async ({ page }) => {
			await page.goto("http://localhost:3000/profile");

			// Verify profile information
			await expect(page.getByRole("heading", { name: /my profile/i })).toBeVisible();
			await expect(page.getByText(/level/i)).toBeVisible();
			await expect(page.getByText(/xp/i)).toBeVisible();
			await expect(page.getByText(/streak/i)).toBeVisible();
		});

		test("should show progress dashboard", async ({ page }) => {
			await page.goto("http://localhost:3000/dashboard");

			// Verify dashboard elements
			await expect(page.getByText(/your progress/i)).toBeVisible();
			await expect(page.getByText(/courses enrolled/i)).toBeVisible();
			await expect(page.getByText(/challenges completed/i)).toBeVisible();
			await expect(page.getByText(/achievements/i)).toBeVisible();
		});

		test("should display leaderboard", async ({ page }) => {
			await page.goto("http://localhost:3000/leaderboard");

			// Verify leaderboard
			await expect(page.getByRole("heading", { name: /leaderboard/i })).toBeVisible();
			await expect(page.getByText(/rank/i)).toBeVisible();
			await expect(page.getByText(/name/i)).toBeVisible();
			await expect(page.getByText(/xp/i)).toBeVisible();
		});
	});

	test.describe("Accessibility", () => {
		test("should be keyboard navigable", async ({ page }) => {
			await page.goto("http://localhost:3000");

			// Test keyboard navigation
			await page.keyboard.press("Tab");
			const focusedElement = page.locator(":focus");
			await expect(focusedElement).toBeVisible();

			// Navigate through focusable elements
			for (let i = 0; i < 5; i++) {
				await page.keyboard.press("Tab");
			}
		});

		test("should have proper ARIA labels", async ({ page }) => {
			await page.goto("http://localhost:3000/courses");

			// Check for ARIA labels on interactive elements
			const buttons = page.getByRole("button");
			const buttonCount = await buttons.count();

			expect(buttonCount).toBeGreaterThan(0);

			// Verify buttons have accessible names
			for (let i = 0; i < Math.min(buttonCount, 3); i++) {
				const button = buttons.nth(i);
				const accessibleName = await button.getAttribute("aria-label");
				expect(accessibleName || (await button.textContent())).toBeTruthy();
			}
		});

		test("should support screen reader navigation", async ({ page }) => {
			await page.goto("http://localhost:3000");

			// Check for semantic HTML structure
			await expect(page.getByRole("main")).toBeVisible();
			await expect(page.getByRole("navigation")).toBeVisible();
		});
	});

	test.describe("Error Handling", () => {
		test("should handle network errors gracefully", async ({ page }) => {
			// Mock network failure
			await page.route("**/api/**", async (route) => {
				await route.abort();
			});

			await page.goto("http://localhost:3000/courses");

			// Verify error state is displayed
			await expect(page.getByText(/network error/i)).toBeVisible();
			await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
		});

		test("should handle 404 errors", async ({ page }) => {
			await page.goto("http://localhost:3000/non-existent-page");

			// Verify 404 page
			await expect(page.getByText(/page not found/i)).toBeVisible();
			await expect(page.getByRole("link", { name: /go home/i })).toBeVisible();
		});

		test("should handle server errors", async ({ page }) => {
			await page.route("**/api/courses", async (route) => {
				await route.fulfill({
					status: 500,
					contentType: "application/json",
					body: JSON.stringify({ error: "Internal server error" }),
				});
			});

			await page.goto("http://localhost:3000/courses");

			// Verify error handling
			await expect(page.getByText(/something went wrong/i)).toBeVisible();
		});
	});

	test.describe("Performance", () => {
		test("should load quickly", async ({ page }) => {
			const startTime = Date.now();

			await page.goto("http://localhost:3000");
			await page.waitForLoadState("networkidle");

			const loadTime = Date.now() - startTime;
			expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
		});

		test("should handle large datasets", async ({ page }) => {
			// Mock large course catalog
			await page.route("**/api/courses", async (route) => {
				const largeCourseList = Array.from({ length: 100 }, (_, i) => ({
					id: `course-${i}`,
					title: `Course ${i}`,
					description: `Description for course ${i}`,
					instructor: `Instructor ${i}`,
					duration: Math.floor(Math.random() * 20) + 1,
					level: ["Beginner", "Intermediate", "Advanced"][Math.floor(Math.random() * 3)],
					xpReward: Math.floor(Math.random() * 1000) + 100,
					lessons: Math.floor(Math.random() * 20) + 5,
					enrolled: Math.floor(Math.random() * 1000),
					rating: Math.random() * 2 + 3, // 3-5 rating
				}));

				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ courses: largeCourseList }),
				});
			});

			await page.goto("http://localhost:3000/courses");

			// Verify large list renders without crashing
			await expect(page.getByText(/course 99/i)).toBeVisible();
		});
	});
});
