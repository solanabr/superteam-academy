import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	outputDir: "./test-results",
	snapshotDir: "./snapshots",

	// Timeout settings
	timeout: 30 * 1000,
	expect: {
		timeout: 5000,
	},

	// Run tests in files in parallel
	fullyParallel: true,

	// Fail the build on CI if you accidentally left test.only in the source code
	forbidOnly: !!process.env.CI,

	// Retry on CI only
	retries: process.env.CI ? 2 : 0,

	// Opt out of parallel tests on CI
	workers: process.env.CI ? 1 : 4,

	// Reporter to use
	reporter: [
		["html"],
		["json", { outputFile: "test-results/results.json" }],
		["junit", { outputFile: "test-results/results.xml" }],
	],

	// Shared settings for all the projects below
	use: {
		// Base URL to use in actions like `await page.goto('/')`
		baseURL: "http://localhost:3000",

		// Collect trace when retrying the failed test
		trace: "on-first-retry",

		// Take screenshot only when test fails
		screenshot: "only-on-failure",

		// Record video only when test fails
		video: "retain-on-failure",
	},

	// Configure projects for major browsers
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},

		// Test against mobile viewports
		{
			name: "Mobile Chrome",
			use: { ...devices["Pixel 5"] },
		},
		{
			name: "Mobile Safari",
			use: { ...devices["iPhone 12"] },
		},

		// Test with accessibility
		{
			name: "accessibility",
			use: { ...devices["Desktop Chrome"] },
			testMatch: "**/*.accessibility.spec.ts",
		},
	],

	// Run your local dev server before starting the tests
	webServer: {
		command: "npm run dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},

	// Global setup and teardown
	globalSetup: require.resolve("./e2e/global-setup"),
	globalTeardown: require.resolve("./e2e/global-teardown"),
});
